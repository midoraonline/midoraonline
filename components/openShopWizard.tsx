"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { apiShops } from "@/lib/api";
import CategoryPicker from "@/components/CategoryPicker";
import { SingleImageField } from "@/components/upload/SingleImageField";
import { discardUploads } from "@/lib/uploads/discard";
import LocationInput from "@/components/LocationInput";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import StepFrame, { ActionBar, FormError, FormField, INPUT, TEXTAREA } from "@/components/post/StepFrame";
import { BTN_PRIMARY, BTN_TEXT } from "@/components/dashboard/ui";
import { useAppSession } from "@/lib/state";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import ShopHoursEditor from "@/components/shop/ShopHoursEditor";
import { buildShopLocationPayload } from "@/components/shop/shopUtils";
import type { LatLng } from "@/lib/geo";
import { blankHoursDraft, hoursAreBlank, hoursDraftError, shopHoursWritePayload, type HoursDraft } from "@/lib/shopHours";
import { isMaintenanceMode, MAINTENANCE_MESSAGE } from "@/lib/platformMessages";

const STEPS = [
  { title: "Name your business", subtitle: "Buyers see this name first. You can change it later." },
  { title: "Where buyers can find you", subtitle: "Add a location and how buyers can reach you." },
  { title: "Add a logo and banner", subtitle: "Photos keep their full quality. You can add these later." },
  { title: "Opening hours", subtitle: "Times are in Kampala time (EAT). You can add these later." },
  { title: "Check and create", subtitle: "Make sure everything looks right, then create your business." },
] as const;

const STEP_LABELS = ["Name", "Contacts", "Logo and banner", "Hours", "Review"] as const;

const FIELD = INPUT;

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

export default function OpenShopWizard({
  onPreferAi,
  onExit,
  verifiedContacts,
}: {
  onPreferAi?: () => void;
  onExit?: () => void;
  verifiedContacts: { email: string | null; phone: string | null };
}) {
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
  const [shopEmail, setShopEmail] = useState(verifiedContacts.email ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(verifiedContacts.phone ?? "");
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

  function skip() {
    if (step === 1 && validate(1)) {
      setShopEmail(verifiedContacts.email ?? "");
      setWhatsappNumber(verifiedContacts.phone ?? "");
    }
    if (step === 3 && validate(3)) setHours(blankHoursDraft);
    setError(null);
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
      // Leaving the wizard: drop anything uploaded but never saved.
      discardUploads([logoUrl, bannerUrl]);
      if (onExit) onExit();
      else router.push("/");
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
      setError("Please log in to create a business.");
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
      router.push(`/merchant/shops/${shop.id}`);
    } catch (err) {
      setError(
        isMaintenanceMode(err)
          ? MAINTENANCE_MESSAGE
          : err instanceof Error
            ? err.message
            : "Could not create your business. Please try again.",
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
      steps={STEP_LABELS}
      preview={
        <ShopPreview
          name={name}
          description={description}
          logoUrl={logoUrl}
          bannerUrl={bannerUrl}
          location={locationDisplay}
          category={category}
        />
      }
    >

      {step === 0 ? (
        <>
          <Field label="Shop name" htmlFor="wizard-shop-name">
            <input
              id="wizard-shop-name"
              className={FIELD}
              placeholder="e.g. Kampala Gourmet Bakery"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {slug ? (
              <p className="text-xs text-muted">
                Your link: <span className="text-foreground">/shops/{slug}</span>
              </p>
            ) : null}
          </Field>
          <>
            <Field label="What you sell">
              <select
                id="wizard-shop-type"
                className={FIELD}
                value={shopType}
                onChange={(e) => setShopType(e.target.value as apiShops.ShopType)}
              >
                <option value="product">Products</option>
                <option value="service">Services</option>
                <option value="both">Products and services</option>
              </select>
            </Field>
            <Field label="Category" optional>
              <CategoryPicker
                value={category}
                onChange={setCategory}
                hideLabel
                hideSummary
                selectClassName={`${FIELD} appearance-none pr-9`}
                idPrefix="open-shop-wizard-category"
              />
            </Field>
          </>
          <Field label="Short description" htmlFor="wizard-shop-desc" optional>
            <input
              id="wizard-shop-desc"
              className={FIELD}
              placeholder="A line buyers see first"
              value={description}
              maxLength={160}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="About your business" htmlFor="wizard-shop-about" optional>
            <textarea
              id="wizard-shop-about"
              className={TEXTAREA}
              placeholder="What you sell, and how you deliver"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </Field>
          {onPreferAi ? (
            <button type="button" onClick={onPreferAi} className={BTN_TEXT}>
              Describe your shop to AI instead
            </button>
          ) : null}
        </>
      ) : null}

      {step === 1 ? (
        <>
          <div>
            <Field label="Town or address" optional>
              <LocationInput
                value={locationDisplay}
                onChange={setLocationDisplay}
                onResolved={(place) => setLocationCoords(place ? { lat: place.lat, lng: place.lng } : null)}
                placeholder="e.g. Ntinda, Kampala"
              />
            </Field>
          </div>
          <Field label="Business email (optional)" htmlFor="wizard-shop-email">
            <input
              id="wizard-shop-email"
              type="email"
              className={FIELD}
              placeholder="hello@yourshop.com"
              value={shopEmail}
              onChange={(e) => setShopEmail(e.target.value)}
            />
          </Field>
          <Field label="Business phone number (optional)">
            <PhoneNumberInput value={whatsappNumber} onChange={setWhatsappNumber} placeholder="700 000 000" />
          </Field>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Field label="Logo" optional>
            <SingleImageField
              endpoint="shopLogo"
              value={logoUrl}
              onChange={(url) => setLogoUrl(url ?? "")}
              emptyLabel="Add logo"
            />
          </Field>
          <Field label="Banner" optional>
            <SingleImageField
              endpoint="shopBanner"
              shape="wide"
              value={bannerUrl}
              onChange={(url) => setBannerUrl(url ?? "")}
              emptyLabel="Add banner"
            />
          </Field>
        </>
      ) : null}

      {step === 3 ? <ShopHoursEditor value={hours} onChange={setHours} /> : null}

      {step === 4 ? (
        <dl className="divide-y divide-border rounded-md border border-border">
          <ReviewRow label="Name" value={name.trim()} onChange={() => setStep(0)} />
          <ReviewRow label="Sells" value={SHOP_TYPE_LABEL[shopType]} />
          <ReviewRow label="Category" value={category.trim() || "Not set"} onChange={() => setStep(0)} />
          <ReviewRow label="Location" value={locationDisplay.trim() || "Not set"} onChange={() => setStep(1)} />
          <ReviewRow label="Business email" value={shopEmail.trim() || "Not set"} onChange={() => setStep(1)} />
          <ReviewRow label="Business phone number" value={whatsappNumber.trim() || "Not set"} onChange={() => setStep(1)} />
          <ReviewRow label="Logo" value={logoUrl ? "Added" : "Not set"} onChange={() => setStep(2)} />
          <ReviewRow label="Banner" value={bannerUrl ? "Added" : "Not set"} onChange={() => setStep(2)} />
          <ReviewRow label="Hours" value={hoursSummary(hours)} onChange={() => setStep(3)} />
        </dl>
      ) : null}

      {error ? <FormError>{error}</FormError> : null}

      <ActionBar>
        {step < STEPS.length - 1 ? (
          <>
            <button type="button" onClick={goNext} className={BTN_PRIMARY}>
              Continue
            </button>
            {step > 0 ? (
              <button type="button" onClick={skip} className={BTN_TEXT}>
                Skip for now
              </button>
            ) : null}
          </>
        ) : (
          <button type="button" onClick={handleCreateShop} disabled={creating} className={BTN_PRIMARY}>
            {creating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {creating ? "Creating business…" : "Create business"}
          </button>
        )}
      </ActionBar>
    </StepFrame>
  );
}

const Field = FormField;

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
      <dt className="w-28 shrink-0 text-xs text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-sm text-foreground">{value}</dd>
      {onChange ? (
        <button type="button" onClick={onChange} className="dm-focus shrink-0 text-xs font-medium text-foreground underline underline-offset-2">
          Change
        </button>
      ) : null}
    </div>
  );
}

function ShopPreview({
  name,
  description,
  logoUrl,
  bannerUrl,
  location,
  category,
}: {
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  location: string;
  category: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      <div className="relative h-24 bg-surface-muted">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerUrl} alt="" className="size-full object-cover" />
        ) : null}
      </div>
      <div className="px-4 pb-4">
        <div className="-mt-6 grid size-12 place-items-center overflow-hidden rounded-xl border-2 border-surface bg-accent/10 text-base font-semibold uppercase text-accent">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="size-full object-cover" />
          ) : (
            (name.trim().charAt(0) || "M")
          )}
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-foreground">{name.trim() || "Your business name"}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{description.trim() || "A short line about what you sell."}</p>
        <p className="mt-2 truncate text-xs text-muted">{[category, location].filter(Boolean).join(" · ") || "Category · Location"}</p>
      </div>
    </div>
  );
}
