"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Plus, BarChart2 } from "lucide-react";
import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import { ImageUpload } from "@/components/image-upload";
import ShopCatalogEditor from "@/components/shop/ShopCatalogEditor";
import LocationInput from "@/components/LocationInput";
import CategoryPicker from "@/components/CategoryPicker";
import { locationDisplay } from "./shopUtils";
import { useAppSession } from "@/lib/state";
import { canManageShopStorefront } from "@/lib/shop/storefront-access";

type EditTab = "details" | "products" | "services";

type FormState = {
  name: string;
  description: string;
  about: string;
  logoUrl: string;
  shopEmail: string;
  whatsappNumber: string;
  availabilityDays: string;
  availabilityHours: string;
  location: string;
  shopType: apiShops.ShopType;
  category: string;
  isActive: boolean;
};

function shopToFormState(shop: Shop): FormState {
  const loc = shop.location;
  return {
    name: shop.name ?? "",
    description: shop.description ?? "",
    about: shop.about ?? "",
    logoUrl: shop.logo_url ?? "",
    shopEmail: shop.shop_email ?? "",
    whatsappNumber: shop.whatsapp_number ?? "",
    availabilityDays: shop.availability?.days ?? "",
    availabilityHours: shop.availability?.hours ?? "",
    location: typeof loc === "string"
      ? loc
      : loc && typeof loc === "object" && "display" in loc
        ? String((loc as { display?: string }).display ?? "")
        : "",
    shopType: shop.shop_type ?? "product",
    category: shop.category ?? "",
    isActive: shop.is_active ?? true,
  };
}

function NotLoggedIn({ shopSlug }: { shopSlug: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="dm-card space-y-4 p-8 text-center">
        <AlertCircle className="mx-auto size-8 text-muted" />
        <p className="text-sm font-semibold">Sign in required</p>
        <p className="text-xs text-muted">Log in to edit your shop.</p>
        <Link
          href={`/login?next=/shops/${shopSlug}/edit`}
          className="dm-pill dm-focus inline-flex bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

function AccessDenied({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="dm-card space-y-4 p-8 text-center">
        <AlertCircle className="mx-auto size-8 text-muted" />
        <p className="text-sm font-semibold">Access denied</p>
        <p className="text-xs text-muted">You must be the shop owner or an admin to edit this page.</p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground dm-focus rounded-xl px-3 py-1.5 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to shop
        </button>
      </div>
    </div>
  );
}

function LogoField({
  currentUrl,
  stagedUrl,
  onStaged,
  onRemove,
}: {
  currentUrl: string;
  stagedUrl: string;
  onStaged: (url: string) => void;
  onRemove: () => void;
}) {
  const displayUrl = stagedUrl || currentUrl;
  const isStaged = Boolean(stagedUrl);

  return (
    <div className="space-y-3">
      {displayUrl && (
        <div className="flex items-center gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-foreground/[0.04] ring-1 ring-foreground/[0.06]">
            <Image
              src={displayUrl}
              alt="Shop logo"
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0 space-y-1">
            {isStaged ? (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/40">
                <span className="size-1.5 rounded-full bg-amber-500" />
                New logo staged — save to apply
              </p>
            ) : (
              <p className="text-xs text-muted">Current logo</p>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="text-[11px] text-muted transition-colors hover:text-red-600 dm-focus rounded"
            >
              Remove logo
            </button>
          </div>
        </div>
      )}

      <ImageUpload
        endpoint="shopLogo"
        label={displayUrl ? "Replace logo" : "Upload logo"}
        allowBackgroundRemoval={false}
        onUploadComplete={(url) => onStaged(url)}
      />
      {!displayUrl && (
        <p className="text-[11px] text-muted">
          PNG or JPG, square crop recommended. Shown in the shop header and cards.
        </p>
      )}
    </div>
  );
}

// ── Reusable toggle switch ──────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-foreground/20",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

function DetailsTab({
  shop,
  form,
  stagedLogo,
  onChange,
  onLogoStaged,
  onLogoRemove,
}: {
  shop: Shop;
  form: FormState;
  stagedLogo: string;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onLogoStaged: (url: string) => void;
  onLogoRemove: () => void;
}) {
  const router = useRouter();
  const session = useAppSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session.isAuthenticated) {
      setError("You must be logged in to save changes.");
      return;
    }
    if (!form.name.trim()) {
      setError("Shop name is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const hasAvailability =
        Boolean(form.availabilityDays.trim()) || Boolean(form.availabilityHours.trim());
      await apiShops.updateShop(shop.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        about: form.about.trim() || null,
        logo_url: form.logoUrl.trim() || null,
        shop_email: form.shopEmail.trim() || null,
        whatsapp_number: form.whatsappNumber.trim() || null,
        availability: hasAvailability
          ? {
              days: form.availabilityDays.trim() || null,
              hours: form.availabilityHours.trim() || null,
            }
          : null,
        location: form.location.trim() && form.location.trim() !== "Online Shop" ? { display: form.location.trim() } : null,
        shop_type: form.shopType,
        category: form.category.trim() || undefined,
        is_active: form.isActive,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.push(`/shops/${shop.slug}`);
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="dm-card flex items-center gap-3 p-5 text-sm font-semibold text-green-700 dark:text-green-400">
        <CheckCircle2 className="size-5 shrink-0 text-green-500" />
        Changes saved — redirecting to your shop…
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <section className="dm-card space-y-4 p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight">Basic information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground/80">
              Shop name <span className="text-red-500">*</span>
            </label>
            <input
              className="dm-input-xs dm-focus"
              placeholder="e.g. My Coffee Shop"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground/80">Short description</label>
            <input
              className="dm-input-xs dm-focus"
              placeholder="Tagline shown on the shop page"
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground/80">About</label>
            <textarea
              className="dm-textarea-xs dm-focus"
              placeholder="Longer description of your shop"
              rows={3}
              value={form.about}
              onChange={(e) => onChange("about", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground/80">Category</label>
            <div className="rounded-xl border border-border bg-white p-3 sm:p-4">
              <CategoryPicker
                value={form.category}
                onChange={(val) => onChange("category", val)}
                compact
                idPrefix="edit-shop-category"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Shop type</label>
            <select
              className="dm-input-xs appearance-none pr-9 dm-focus"
              value={form.shopType}
              onChange={(e) => onChange("shopType", e.target.value as apiShops.ShopType)}
            >
              <option value="product">Products</option>
              <option value="service">Services</option>
              <option value="both">Products &amp; Services</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Location</label>
            {/* Use the same LocationInput (OpenStreetMap) as the Open Shop wizard */}
            <LocationInput
              value={form.location}
              onChange={(val) => onChange("location", val)}
              placeholder="e.g. Kisasi, Kampala"
            />
          </div>
        </div>
      </section>

      <section className="dm-card space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Shop logo</h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Upload your logo, then hit <strong>Save changes</strong> to apply it.
          </p>
        </div>
        <LogoField
          currentUrl={shop.logo_url ?? ""}
          stagedUrl={stagedLogo}
          onStaged={(url) => {
            onLogoStaged(url);
            onChange("logoUrl", url);
          }}
          onRemove={() => {
            onLogoRemove();
            onChange("logoUrl", "");
          }}
        />
      </section>

      <section className="dm-card space-y-4 p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight">Contact details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Shop email</label>
            <input
              type="email"
              className="dm-input-xs dm-focus"
              placeholder="hello@shop.com"
              value={form.shopEmail}
              onChange={(e) => onChange("shopEmail", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">WhatsApp number</label>
            <input
              className="dm-input-xs dm-focus"
              placeholder="+256700000000"
              value={form.whatsappNumber}
              onChange={(e) => {
                let val = e.target.value;
                if (val.startsWith("0")) val = "+256" + val.slice(1);
                onChange("whatsappNumber", val);
              }}
            />
          </div>
        </div>
      </section>

      <section className="dm-card space-y-4 p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight">Availability</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Open days</label>
            <input
              className="dm-input-xs dm-focus"
              placeholder="e.g. Mon – Fri"
              value={form.availabilityDays}
              onChange={(e) => onChange("availabilityDays", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Hours</label>
            <input
              className="dm-input-xs dm-focus"
              placeholder="e.g. 9 AM – 6 PM"
              value={form.availabilityHours}
              onChange={(e) => onChange("availabilityHours", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ── Shop Status (proper toggle switch) ─────────────────────────────── */}
      <section className="dm-card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Shop status</h2>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground/90">Shop is active</p>
            <p className="text-xs text-muted">
              When off, your shop shows as temporarily closed to customers.
            </p>
          </div>
          <ToggleSwitch
            id="shop-is-active"
            checked={form.isActive}
            onChange={(v) => onChange("isActive", v)}
          />
        </div>
      </section>

      <div className="flex items-center justify-between gap-4 pb-4">
        <button
          type="button"
          onClick={() => router.push(`/shops/${shop.slug}`)}
          className="text-xs text-muted hover:text-foreground dm-focus rounded-xl px-3 py-2 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="dm-pill dm-focus inline-flex items-center gap-2 bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </form>
  );
}

export default function EditShopForm({ shop }: { shop: Shop }) {
  const router = useRouter();
  const session = useAppSession();

  const [tab, setTab] = useState<EditTab>("details");
  const [form, setForm] = useState<FormState>(() => shopToFormState(shop));
  // Track the logo URL that has been uploaded but not yet saved — lets us show
  // a preview + "staged" warning without touching the persisted shop record.
  const [stagedLogo, setStagedLogo] = useState("");

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (!session.hydrated) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="dm-card p-8 text-center">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (session.hydrated && !session.isAuthenticated) {
    return <NotLoggedIn shopSlug={shop.slug} />;
  }

  const canManage = canManageShopStorefront(session, shop.id);
  if (session.hydrated && session.isAuthenticated && !canManage) {
    return <AccessDenied onBack={() => router.push(`/shops/${shop.slug}`)} />;
  }

  const tabs: { id: EditTab; label: string }[] = [
    { id: "details", label: "Shop details" },
    { id: "products", label: "Products" },
    { id: "services", label: "Services" },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-7">
      {/* ── Header: title + action buttons ────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Edit shop</h1>
          <p className="mt-0.5 text-sm text-muted">
            Manage {shop.name}&apos;s details, products, and services.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Add product — prominent CTA near analytics */}
          <button
            type="button"
            onClick={() => setTab("products")}
            className="dm-pill dm-focus inline-flex items-center gap-1.5 bg-accent px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            <Plus className="size-3.5" />
            Add product
          </button>
          <Link
            href={`/shops/${shop.slug}/analytics`}
            className="dm-pill dm-focus inline-flex items-center gap-1.5 border border-foreground/[0.1] bg-foreground/[0.05] px-3 py-2 text-xs font-semibold text-foreground/90 hover:bg-foreground/[0.08]"
          >
            <BarChart2 className="size-3.5" />
            Analytics
          </Link>
          <button
            type="button"
            onClick={() => router.push(`/shops/${shop.slug}`)}
            className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs text-muted transition-colors hover:text-foreground dm-focus"
          >
            <ArrowLeft className="size-3.5" />
            Back to shop
          </button>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div
        role="tablist"
        className="flex flex-wrap gap-1 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={[
              "rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
              tab === t.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <DetailsTab
          shop={shop}
          form={form}
          stagedLogo={stagedLogo}
          onChange={onChange}
          onLogoStaged={(url) => setStagedLogo(url)}
          onLogoRemove={() => setStagedLogo("")}
        />
      )}

      {tab === "products" && (
        <ShopCatalogEditor shopId={shop.id} itemType="product" heading="Products" shopLogoUrl={shop.logo_url ?? null} />
      )}

      {tab === "services" && (
        <ShopCatalogEditor shopId={shop.id} itemType="service" heading="Services" shopLogoUrl={shop.logo_url ?? null} />
      )}
    </div>
  );
}
