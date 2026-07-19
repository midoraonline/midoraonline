"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, BarChart2, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiShops } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import { ImageUpload } from "@/components/image-upload";
import ShopCatalogEditor from "@/components/shop/ShopCatalogEditor";
import LocationInput from "@/components/LocationInput";
import CategoryPicker from "@/components/CategoryPicker";
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
    location:
      typeof loc === "string"
        ? loc
        : loc && typeof loc === "object" && "display" in loc
          ? String((loc as { display?: string }).display ?? "")
          : "",
    shopType: shop.shop_type ?? "product",
    category: shop.category ?? "",
    isActive: shop.is_active ?? true,
  };
}

function formsEqual(a: FormState, b: FormState): boolean {
  return (
    a.name === b.name &&
    a.description === b.description &&
    a.about === b.about &&
    a.logoUrl === b.logoUrl &&
    a.shopEmail === b.shopEmail &&
    a.whatsappNumber === b.whatsappNumber &&
    a.availabilityDays === b.availabilityDays &&
    a.availabilityHours === b.availabilityHours &&
    a.location === b.location &&
    a.shopType === b.shopType &&
    a.category === b.category &&
    a.isActive === b.isActive
  );
}

// ── Access gates ────────────────────────────────────────────────────────────
function NotLoggedIn({ shopSlug }: { shopSlug: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="dm-card space-y-4 p-8 text-center">
        <AlertCircle className="mx-auto size-8 text-muted" aria-hidden="true" />
        <p className="text-sm font-semibold">Sign in required</p>
        <p className="text-xs text-muted">Log in to edit your shop.</p>
        <Link
          href={`/login?next=/shops/${shopSlug}/edit`}
          className="dm-btn dm-btn-primary inline-flex"
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
        <AlertCircle className="mx-auto size-8 text-muted" aria-hidden="true" />
        <p className="text-sm font-semibold">Access denied</p>
        <p className="text-xs text-muted">
          You must be the shop owner or an admin to edit this page.
        </p>
        <button type="button" onClick={onBack} className="dm-btn dm-btn-ghost dm-btn-sm">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to shop
        </button>
      </div>
    </div>
  );
}

// ── Logo field ──────────────────────────────────────────────────────────────
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
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface-subtle">
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
              <p
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background: "var(--warning-subtle)",
                  color: "var(--warning)",
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: "var(--warning)" }}
                />
                New logo staged — save to apply
              </p>
            ) : (
              <p className="text-xs text-muted">Current logo</p>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="text-[11px] text-muted transition-colors hover:text-[color:var(--error)] dm-focus rounded"
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

// ── Details tab ─────────────────────────────────────────────────────────────
function DetailsTab({
  shop,
  form,
  stagedLogo,
  isDirty,
  onChange,
  onLogoStaged,
  onLogoRemove,
  onSaved,
}: {
  shop: Shop;
  form: FormState;
  stagedLogo: string;
  isDirty: boolean;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onLogoStaged: (url: string) => void;
  onLogoRemove: () => void;
  onSaved: (savedForm: FormState) => void;
}) {
  const router = useRouter();
  const session = useAppSession();
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Shop name is required.";
    return e;
  }, [form.name]);

  const canSubmit = Object.keys(errors).length === 0;

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const ok =
        typeof window === "undefined"
          ? true
          : window.confirm("Discard your changes?");
      if (!ok) return;
    }
    router.push(`/shops/${shop.slug}`);
  }, [isDirty, router, shop.slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowErrors(true);
    if (!session.isAuthenticated) {
      toast.error("Sign in required", {
        description: "Log in again to save your changes.",
      });
      return;
    }
    if (!canSubmit) return;

    const hasAvailability =
      Boolean(form.availabilityDays.trim()) ||
      Boolean(form.availabilityHours.trim());
    const payload = {
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
      location:
        form.location.trim() && form.location.trim() !== "Online Shop"
          ? { display: form.location.trim() }
          : null,
      shop_type: form.shopType,
      category: form.category.trim() || undefined,
      is_active: form.isActive,
    };

    setSaving(true);
    const request = apiShops.updateShop(shop.id, payload);
    toast.promise(request, {
      loading: "Saving changes…",
      success: "Shop updated",
      error: (err) =>
        err instanceof Error
          ? err.message
          : "Could not save changes. Please try again.",
    });
    try {
      await request;
      onSaved(form);
      router.push(`/shops/${shop.slug}`);
    } catch {
      /* handled by sonner */
    } finally {
      setSaving(false);
    }
  }

  const errorId = (field: keyof FormState) =>
    showErrors && errors[field] ? `edit-shop-error-${field}` : undefined;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
      <section className="dm-card space-y-4 p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight">Basic information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="edit-shop-name" className="text-sm font-medium text-foreground">
              Shop name <span className="text-[color:var(--error)]">*</span>
            </label>
            <input
              id="edit-shop-name"
              className="dm-input"
              placeholder="e.g. My Coffee Shop"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              aria-invalid={showErrors && Boolean(errors.name)}
              aria-describedby={errorId("name")}
            />
            {showErrors && errors.name ? (
              <p id={errorId("name")} className="text-xs text-[color:var(--error)]">
                {errors.name}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="edit-shop-description"
              className="text-sm font-medium text-foreground"
            >
              Short description
            </label>
            <input
              id="edit-shop-description"
              className="dm-input"
              placeholder="Tagline shown on the shop page"
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="edit-shop-about" className="text-sm font-medium text-foreground">
              About
            </label>
            <textarea
              id="edit-shop-about"
              className="dm-textarea"
              placeholder="Longer description of your shop"
              rows={3}
              value={form.about}
              onChange={(e) => onChange("about", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <p className="text-sm font-medium text-foreground">Category</p>
            <div className="dm-card p-3 sm:p-4">
              <CategoryPicker
                value={form.category}
                onChange={(val) => onChange("category", val)}
                compact
                idPrefix="edit-shop-category"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-shop-type" className="text-sm font-medium text-foreground">
              Shop type
            </label>
            <select
              id="edit-shop-type"
              className="dm-input appearance-none pr-9"
              value={form.shopType}
              onChange={(e) => onChange("shopType", e.target.value as apiShops.ShopType)}
            >
              <option value="product">Products</option>
              <option value="service">Services</option>
              <option value="both">Products &amp; Services</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Location</p>
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
            <label htmlFor="edit-shop-email" className="text-sm font-medium text-foreground">
              Shop email
            </label>
            <input
              id="edit-shop-email"
              type="email"
              className="dm-input"
              placeholder="hello@shop.com"
              value={form.shopEmail}
              onChange={(e) => onChange("shopEmail", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="edit-shop-whatsapp"
              className="text-sm font-medium text-foreground"
            >
              WhatsApp number
            </label>
            <input
              id="edit-shop-whatsapp"
              className="dm-input"
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
            <label htmlFor="edit-shop-days" className="text-sm font-medium text-foreground">
              Open days
            </label>
            <input
              id="edit-shop-days"
              className="dm-input"
              placeholder="e.g. Mon – Fri"
              value={form.availabilityDays}
              onChange={(e) => onChange("availabilityDays", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-shop-hours" className="text-sm font-medium text-foreground">
              Hours
            </label>
            <input
              id="edit-shop-hours"
              className="dm-input"
              placeholder="e.g. 9 AM – 6 PM"
              value={form.availabilityHours}
              onChange={(e) => onChange("availabilityHours", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="dm-card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Shop status</h2>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">Shop is active</p>
            <p className="text-xs text-muted">
              When off, your shop shows as temporarily closed to customers.
            </p>
          </div>
          <button
            type="button"
            id="shop-is-active"
            role="switch"
            aria-checked={form.isActive}
            aria-label="Shop is active"
            onClick={() => onChange("isActive", !form.isActive)}
            className="dm-toggle"
          >
            <span className="dm-toggle-thumb" />
          </button>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4 pb-4">
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="dm-btn dm-btn-ghost dm-btn-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || (showErrors && !canSubmit)}
          className="dm-btn dm-btn-primary"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ── Page shell ──────────────────────────────────────────────────────────────
export default function EditShopForm({ shop }: { shop: Shop }) {
  const router = useRouter();
  const session = useAppSession();

  const [tab, setTab] = useState<EditTab>("details");
  const [initialForm, setInitialForm] = useState<FormState>(() =>
    shopToFormState(shop),
  );
  const [form, setForm] = useState<FormState>(initialForm);
  const [stagedLogo, setStagedLogo] = useState("");

  const isDirty = !formsEqual(form, initialForm);

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSaved(savedForm: FormState) {
    setInitialForm(savedForm);
    setForm(savedForm);
    setStagedLogo("");
  }

  // Warn on hard navigation / refresh while dirty.
  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

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

  function handleTabChange(next: EditTab) {
    if (tab === "details" && next !== "details" && isDirty) {
      const ok =
        typeof window === "undefined"
          ? true
          : window.confirm("You have unsaved changes. Discard them?");
      if (!ok) return;
      setForm(initialForm);
      setStagedLogo("");
    }
    setTab(next);
  }

  function handleBack() {
    if (isDirty) {
      const ok =
        typeof window === "undefined"
          ? true
          : window.confirm("Discard your changes?");
      if (!ok) return;
    }
    router.push(`/shops/${shop.slug}`);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Edit shop</h1>
          <p className="mt-0.5 text-sm text-muted">
            Manage {shop.name}&apos;s details, products, and services.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("products")}
            className="dm-btn dm-btn-primary dm-btn-sm"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add product
          </button>
          <Link
            href={`/shops/${shop.slug}/analytics`}
            className="dm-btn dm-btn-secondary dm-btn-sm"
          >
            <BarChart2 className="size-3.5" aria-hidden="true" />
            Analytics
          </Link>
          <button
            type="button"
            onClick={handleBack}
            className="dm-btn dm-btn-ghost dm-btn-sm"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to shop
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Edit shop sections"
        className="flex flex-wrap gap-1 rounded-2xl border border-border bg-surface-subtle p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => handleTabChange(t.id)}
            className={[
              "rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
              tab === t.id
                ? "bg-surface text-foreground shadow-sm"
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
          isDirty={isDirty}
          onChange={onChange}
          onLogoStaged={(url) => setStagedLogo(url)}
          onLogoRemove={() => setStagedLogo("")}
          onSaved={onSaved}
        />
      )}

      {tab === "products" && (
        <ShopCatalogEditor
          shopId={shop.id}
          itemType="product"
          heading="Products"
          shopLogoUrl={shop.logo_url ?? null}
        />
      )}

      {tab === "services" && (
        <ShopCatalogEditor
          shopId={shop.id}
          itemType="service"
          heading="Services"
          shopLogoUrl={shop.logo_url ?? null}
        />
      )}
    </div>
  );
}
