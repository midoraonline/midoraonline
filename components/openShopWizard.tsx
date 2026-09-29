"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { apiShops } from "@/lib/api";
import CategoryPicker from "@/components/CategoryPicker";
import { ImageUpload } from "@/components/image-upload";
import LocationInput from "@/components/LocationInput";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import StepFrame from "@/components/post/StepFrame";
import { useAppSession } from "@/lib/state";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import ShopHoursEditor from "@/components/shop/ShopHoursEditor";
import { buildShopLocationPayload } from "@/components/shop/shopUtils";
import type { LatLng } from "@/lib/geo";
import { blankHoursDraft, hoursAreBlank, hoursDraftError, shopHoursWritePayload, type HoursDraft } from "@/lib/shopHours";
import { isMaintenanceMode, MAINTENANCE_MESSAGE } from "@/lib/platformMessages";

const STEPS = [
  { title: "Shop basics", subtitle: "Name your shop and choose what you sell." },
  { title: "Location and contact", subtitle: "Where you are, and how buyers reach you on WhatsApp." },
  { title: "Logo and banner", subtitle: "Photos stay full quality. Only iPhone HEIC files are converted." },
  { title: "Opening hours", subtitle: "Times are in Kampala (EAT). Skip this if you want to add hours later." },
  { title: "Review and create", subtitle: "Check the details, then publish your shop." },
] as const;

const FIELD =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm dm-focus";

const SHOP_TYPE_LABEL: Record<apiShops.ShopType, string> = {
  product: "Products",
  service: "Services",
  both: "Products and services",
};

function slugFromName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || ""
  );
}

function emailError(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
  return null;
}

function phoneError(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!value.trim()) return null;
  if (digits.length < 9) return "Enter a full WhatsApp number.";
  return null;
}

function hoursSummary(draft: HoursDraft): string {
  if (hoursAreBlank(draft)) return "Not set";
  if (draft.mode === "always") return "Open 24 hours";
  if (draft.mode === "appointment") return "By appointment";
  return "Weekly hours";
}

export default function OpenShopWizard({ onPreferAi }: { onPreferAi?: () => void }) {
  const session = useAppSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [locationDisplay, setLocationDisplay] = useState("");
  const [locationCoords, setLocationCoords] = useState<LatLng | null>(null);
  const [shopType, setShopType] = useState<apiShops.ShopType>("product");
  const [category, setCategory] = useState("");
  const [hours, setHours] = useState(blankHoursDraft);

  function goNext() {
    const message = validate(step);
    setError(message);
    if (message) return;
    setStep((n) => Math.min(n + 1, STEPS.length - 1));
  }

  function validate(index: number): string | null {
    if (index === 0) {
      if (!name.trim()) return "Enter a shop name.";
      if (!slugFromName(name)) return "Shop name must contain at least one letter or number.";
      return null;
    }
    if (index === 1) return emailError(shopEmail) ?? phoneError(whatsappNumber);
    if (index === 3) return hoursDraftError(hours);
    return null;
  }

  function back() {
    setError(null);
    if (step === 0) {
      router.push("/");
      return;
    }
    setStep((n) => n - 1);
  }

  async function handleCreateShop() {
    const message = [0, 1, 3].map(validate).find(Boolean) ?? null;
    if (message) {
      setError(message);
      return;
    }
    if (!session.isAuthenticated) {
      setError("Please log in to open a shop.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const shop = await apiShops.createShop({
        name: name.trim(),
        slug: slugFromName(name),
        description: description.trim() || undefined,
        about: about.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        shop_email: shopEmail.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
        location: buildShopLocationPayload(locationDisplay, locationCoords) ?? undefined,
        ...(hoursAreBlank(hours) ? {} : shopHoursWritePayload(hours)),
        shop_type: shopType,
        category: category.trim() || undefined,
        theme_config: bannerUrl.trim()
          ? { metadata: { banner_url: bannerUrl.trim() } }
          : undefined,
        contacts: [],
        social_links: [],
      });
      notifyAuthChanged();
      router.push(`/merchant/shops/${shop.id}/verification`);
    } catch (err) {
      setError(
        isMaintenanceMode(err)
          ? MAINTENANCE_MESSAGE
          : err instanceof Error
            ? err.message
            : "Could not create your shop. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  const current = STEPS[step];
  const slug = slugFromName(name);

  return (
    <StepFrame
      title={current.title}
      subtitle={current.subtitle}
      onBack={back}
      step={step + 1}
      total={STEPS.length}
    >
      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-[color:var(--error)]/30 bg-[color:var(--error)]/10 px-3 py-2.5 text-sm text-[color:var(--error)]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      {step === 0 ? (
        <>
          <Field label="Shop name" htmlFor="wizard-shop-name" required>
            <input
              id="wizard-shop-name"
              className={FIELD}
              placeholder="e.g. Kampala Gourmet Bakery"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {slug ? (
              <p className="text-[11px] text-muted">
                Public URL: <span className="font-mono text-foreground">/shops/{slug}</span>
              </p>
            ) : null}
          </Field>
          <Field label="What you sell">
            <select
              id="wizard-shop-type"
              className={FIELD}
              value={shopType}
              onChange={(e) => setShopType(e.target.value as apiShops.ShopType)}
            >
              <option value="product">Products</option>
              <option value="service">Services</option>
              <option value="both">Both products and services</option>
            </select>
          </Field>
          <Field label="Category">
            <CategoryPicker
              value={category}
              onChange={setCategory}
              hideLabel
              hideSummary
              selectClassName={`${FIELD} appearance-none pr-9`}
              idPrefix="open-shop-wizard-category"
            />
          </Field>
          <Field label="Short description" htmlFor="wizard-shop-desc">
            <input
              id="wizard-shop-desc"
              className={FIELD}
              placeholder="A line buyers see first"
              value={description}
              maxLength={160}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="About" htmlFor="wizard-shop-about">
            <textarea
              id="wizard-shop-about"
              className="min-h-24 w-full rounded-xl border border-border bg-background p-3 text-sm dm-focus"
              placeholder="What you sell, and how you deliver"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </Field>
          {onPreferAi ? (
            <button type="button" onClick={onPreferAi} className="dm-focus min-h-11 text-sm font-semibold text-accent">
              Create with AI instead
            </button>
          ) : null}
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Field label="Town or address">
            <LocationInput
              value={locationDisplay}
              onChange={setLocationDisplay}
              onResolved={(place) => setLocationCoords(place ? { lat: place.lat, lng: place.lng } : null)}
              placeholder="e.g. Ntinda, Kampala"
            />
          </Field>
          <Field label="Business email" htmlFor="wizard-shop-email">
            <input
              id="wizard-shop-email"
              type="email"
              className={FIELD}
              placeholder="hello@yourshop.com"
              value={shopEmail}
              onChange={(e) => setShopEmail(e.target.value)}
            />
          </Field>
          <Field label="WhatsApp number">
            <PhoneNumberInput value={whatsappNumber} onChange={setWhatsappNumber} placeholder="700 000 000" />
          </Field>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Field label="Logo">
            <ImageUpload
              endpoint="shopLogo"
              preserveQuality
              allowBackgroundRemoval={false}
              onUploadComplete={setLogoUrl}
              label="Upload logo"
              previewUrl={logoUrl || undefined}
            />
          </Field>
          <Field label="Banner">
            <ImageUpload
              endpoint="imageUploader"
              preserveQuality
              allowBackgroundRemoval={false}
              onUploadComplete={setBannerUrl}
              label="Upload banner"
              previewUrl={bannerUrl || undefined}
            />
          </Field>
        </>
      ) : null}

      {step === 3 ? <ShopHoursEditor value={hours} onChange={setHours} /> : null}

      {step === 4 ? (
        <dl className="divide-y divide-border rounded-xl border border-border">
          <ReviewRow label="Name" value={name.trim()} onChange={() => setStep(0)} />
          <ReviewRow label="Sells" value={SHOP_TYPE_LABEL[shopType]} />
          <ReviewRow label="Category" value={category.trim() || "Not set"} onChange={() => setStep(0)} />
          <ReviewRow label="Location" value={locationDisplay.trim() || "Not set"} onChange={() => setStep(1)} />
          <ReviewRow label="Email" value={shopEmail.trim() || "Not set"} onChange={() => setStep(1)} />
          <ReviewRow label="WhatsApp" value={whatsappNumber.trim() || "Not set"} onChange={() => setStep(1)} />
          <ReviewRow label="Logo" value={logoUrl ? "Added" : "Not set"} onChange={() => setStep(2)} />
          <ReviewRow label="Banner" value={bannerUrl ? "Added" : "Not set"} onChange={() => setStep(2)} />
          <ReviewRow label="Hours" value={hoursSummary(hours)} onChange={() => setStep(3)} />
        </dl>
      ) : null}

      {step < STEPS.length - 1 ? (
        <button type="button" onClick={goNext} className="dm-btn dm-btn-primary min-h-11 w-full active:scale-[0.98]">
          Continue
        </button>
      ) : (
        <button
          type="button"
          onClick={handleCreateShop}
          disabled={creating}
          className="dm-btn dm-btn-primary min-h-11 w-full active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {creating ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {creating ? "Creating shop…" : "Create shop"}
        </button>
      )}
    </StepFrame>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
        {required ? <span className="text-[color:var(--error)]"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <dt className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-sm text-foreground">{value}</dd>
      {onChange ? (
        <button type="button" onClick={onChange} className="dm-focus shrink-0 text-xs font-semibold text-accent">
          Change
        </button>
      ) : null}
    </div>
  );
}
