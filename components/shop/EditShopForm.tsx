"use client";

import Link from "next/link";
import { useAtomValue } from "jotai/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiShops } from "@/lib/api";
import type { Shop, ThemeConfig } from "@/lib/api/shops";
import { ImageUpload } from "@/components/image-upload";
import ShopCatalogEditor from "@/components/shop/ShopCatalogEditor";
import { locationDisplay } from "./shopUtils";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { sessionAtom } from "@/lib/state";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("midora_access_token");
}

type EditTab = "details" | "products" | "services" | "appearance";

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
  isActive: boolean;
};

type AppearanceState = {
  primary_color: string;
  background_color: string;
  text_color: string;
  font: string;
  theme: string;
  metadataJson: string;
};

function shopToFormState(shop: Shop): FormState {
  return {
    name: shop.name ?? "",
    description: shop.description ?? "",
    about: shop.about ?? "",
    logoUrl: shop.logo_url ?? "",
    shopEmail: shop.shop_email ?? "",
    whatsappNumber: shop.whatsapp_number ?? "",
    availabilityDays: shop.availability?.days ?? "",
    availabilityHours: shop.availability?.hours ?? "",
    location: locationDisplay(shop.location),
    shopType: shop.shop_type ?? "product",
    isActive: shop.is_active ?? true,
  };
}

function themeFromShop(shop: Shop): AppearanceState {
  const raw = (shop.theme_config ?? {}) as Record<string, unknown>;
  let metadata: unknown = {};
  if (raw.metadata && typeof raw.metadata === "object") metadata = raw.metadata;
  return {
    primary_color: String(raw.primary_color ?? "#1a1a1a"),
    background_color: String(raw.background_color ?? "#ffffff"),
    text_color: String(raw.text_color ?? "#111111"),
    font: String(raw.font ?? "Inter"),
    theme: String(raw.theme ?? "default"),
    metadataJson: JSON.stringify(metadata, null, 2),
  };
}

export default function EditShopForm({ shop }: { shop: Shop }) {
  const router = useRouter();
  const session = useAtomValue(sessionAtom);

  const [tab, setTab] = useState<EditTab>("details");
  const [form, setForm] = useState<FormState>(shopToFormState(shop));
  const [appearance, setAppearance] = useState<AppearanceState>(() => themeFromShop(shop));

  const [saving, setSaving] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appearanceError, setAppearanceError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isOwner = session.ownedShopIds.includes(shop.id);
  const denied = session.hydrated && session.token && !isOwner;
  const needsLogin = session.hydrated && !session.token;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) {
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
      await apiShops.updateShop(token, shop.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        about: form.about.trim() || undefined,
        logo_url: form.logoUrl.trim() || undefined,
        shop_email: form.shopEmail.trim() || undefined,
        whatsapp_number: form.whatsappNumber.trim() || undefined,
        availability: {
          days: form.availabilityDays.trim() || undefined,
          hours: form.availabilityHours.trim() || undefined,
        },
        location: form.location.trim()
          ? { display: form.location.trim() }
          : undefined,
        shop_type: form.shopType,
        is_active: form.isActive,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/shops/${shop.slug}`);
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAppearance(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    let metadata: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(appearance.metadataJson || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        metadata = parsed as Record<string, unknown>;
      } else {
        setAppearanceError("Metadata must be a JSON object.");
        return;
      }
    } catch {
      setAppearanceError("Invalid JSON in metadata.");
      return;
    }

    const theme_config: ThemeConfig = {
      primary_color: appearance.primary_color,
      background_color: appearance.background_color,
      text_color: appearance.text_color,
      font: appearance.font,
      theme: appearance.theme,
      metadata,
    };

    setAppearanceError(null);
    setSavingAppearance(true);
    try {
      await apiShops.updateShop(token, shop.id, { theme_config });
      setAppearanceError(null);
    } catch (err) {
      setAppearanceError(
        err instanceof Error ? err.message : "Could not save appearance."
      );
    } finally {
      setSavingAppearance(false);
    }
  }

  if (!session.hydrated) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="dm-card p-8 text-center">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="dm-card space-y-4 p-8 text-center">
          <AlertCircle className="mx-auto size-8 text-muted" />
          <p className="text-sm font-semibold">Sign in required</p>
          <p className="text-xs text-muted">Log in to edit your shop.</p>
          <Link
            href={`/login?next=/shops/${shop.slug}/edit`}
            className="dm-pill dm-focus inline-flex bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="dm-card space-y-4 p-8 text-center">
          <AlertCircle className="mx-auto size-8 text-muted" />
          <p className="text-sm font-semibold">Access denied</p>
          <p className="text-xs text-muted">You must be the shop owner to edit this page.</p>
          <button
            type="button"
            onClick={() => router.push(`/shops/${shop.slug}`)}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground dm-focus rounded-xl px-3 py-1.5 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to shop
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="dm-card space-y-3 p-8 text-center">
          <CheckCircle2 className="mx-auto size-8 text-green-600" />
          <p className="text-sm font-semibold">Changes saved!</p>
          <p className="text-xs text-muted">Redirecting to your shop…</p>
        </div>
      </div>
    );
  }

  const tabs: { id: EditTab; label: string }[] = [
    { id: "details", label: "Shop details" },
    { id: "products", label: "Products" },
    { id: "services", label: "Services" },
    { id: "appearance", label: "Look & metadata" },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Edit shop</h1>
          <p className="mt-1 text-sm text-muted">Manage your storefront, catalog, and theme.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/shops/${shop.slug}/analytics`}
            className="dm-pill dm-focus inline-flex items-center gap-1.5 border border-foreground/[0.1] bg-foreground/[0.05] px-3 py-2 text-xs font-semibold text-foreground/90 hover:bg-foreground/[0.08] sm:text-sm"
          >
            Analytics
          </Link>
          <button
            type="button"
            onClick={() => router.push(`/shops/${shop.slug}`)}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground dm-focus rounded-xl px-2 py-1.5 transition-colors shrink-0 sm:text-sm"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
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

      {tab === "details" ? (
        <>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 dark:bg-red-950/30 dark:border-red-900/50">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="dm-card p-6 space-y-4">
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
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground/80">Short description</label>
                  <input
                    className="dm-input-xs dm-focus"
                    placeholder="Tagline shown on the shop page"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground/80">About</label>
                  <textarea
                    className="dm-textarea-xs dm-focus"
                    placeholder="Longer description of your shop"
                    value={form.about}
                    onChange={(e) => set("about", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">Shop type</label>
                  <select
                    className="dm-input-xs appearance-none pr-9 dm-focus"
                    value={form.shopType}
                    onChange={(e) => set("shopType", e.target.value as apiShops.ShopType)}
                  >
                    <option value="product">Products</option>
                    <option value="service">Services</option>
                    <option value="both">Products &amp; Services</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">Location</label>
                  <input
                    className="dm-input-xs dm-focus"
                    placeholder="e.g. Kampala, Uganda"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground/80">Logo</label>
                  <ImageUpload
                    endpoint="shopLogo"
                    onUploadComplete={(url) => set("logoUrl", url)}
                    label={form.logoUrl ? "Replace logo" : "Upload logo"}
                    previewUrl={form.logoUrl || undefined}
                  />
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => set("logoUrl", "")}
                      className="mt-1 text-xs text-muted hover:text-foreground transition-colors"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section className="dm-card p-6 space-y-4">
              <h2 className="text-sm font-semibold tracking-tight">Contact details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">Shop email</label>
                  <input
                    type="email"
                    className="dm-input-xs dm-focus"
                    placeholder="hello@shop.com"
                    value={form.shopEmail}
                    onChange={(e) => set("shopEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">WhatsApp number</label>
                  <input
                    className="dm-input-xs dm-focus"
                    placeholder="+256700000000"
                    value={form.whatsappNumber}
                    onChange={(e) => set("whatsappNumber", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="dm-card p-6 space-y-4">
              <h2 className="text-sm font-semibold tracking-tight">Availability</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">Open days</label>
                  <input
                    className="dm-input-xs dm-focus"
                    placeholder="e.g. Mon – Fri"
                    value={form.availabilityDays}
                    onChange={(e) => set("availabilityDays", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">Hours</label>
                  <input
                    className="dm-input-xs dm-focus"
                    placeholder="e.g. 9 AM – 6 PM"
                    value={form.availabilityHours}
                    onChange={(e) => set("availabilityHours", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="dm-card p-6 space-y-4">
              <h2 className="text-sm font-semibold tracking-tight">Shop status</h2>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.isActive}
                    onChange={(e) => set("isActive", e.target.checked)}
                  />
                  <div className="h-5 w-9 rounded-full border border-border bg-surface transition-colors peer-checked:bg-primary peer-checked:border-primary" />
                  <div className="absolute top-0.5 left-0.5 size-4 rounded-full bg-muted transition-transform peer-checked:translate-x-4 peer-checked:bg-background" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground/90">Shop is active</p>
                  <p className="text-xs text-muted mt-0.5">
                    When off, your shop shows as temporarily closed to customers.
                  </p>
                </div>
              </label>
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
                className="dm-pill dm-focus bg-primary text-primary-foreground hover:opacity-95 px-6 py-2.5 text-sm font-semibold disabled:opacity-60 transition-opacity"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </>
      ) : null}

      {tab === "products" ? (
        <ShopCatalogEditor shopId={shop.id} itemType="product" heading="Products" />
      ) : null}

      {tab === "services" ? (
        <ShopCatalogEditor shopId={shop.id} itemType="service" heading="Services" />
      ) : null}

      {tab === "appearance" ? (
        <form onSubmit={(e) => void handleSaveAppearance(e)} className="space-y-6">
          {appearanceError ? (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 dark:bg-red-950/30 dark:border-red-900/50">
              {appearanceError}
            </p>
          ) : null}

          <section className="dm-card p-6 space-y-4">
            <h2 className="text-sm font-semibold tracking-tight">Theme &amp; colors</h2>
            <p className="text-xs text-muted">
              Stored in <code className="rounded bg-foreground/[0.06] px-1 py-0.5">theme_config</code> for your storefront
              and SEO helpers.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">Primary color</label>
                <input
                  type="text"
                  className="dm-input-xs dm-focus"
                  value={appearance.primary_color}
                  onChange={(e) => setAppearance((a) => ({ ...a, primary_color: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">Background color</label>
                <input
                  type="text"
                  className="dm-input-xs dm-focus"
                  value={appearance.background_color}
                  onChange={(e) => setAppearance((a) => ({ ...a, background_color: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">Text color</label>
                <input
                  type="text"
                  className="dm-input-xs dm-focus"
                  value={appearance.text_color}
                  onChange={(e) => setAppearance((a) => ({ ...a, text_color: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">Font family</label>
                <input
                  className="dm-input-xs dm-focus"
                  value={appearance.font}
                  onChange={(e) => setAppearance((a) => ({ ...a, font: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-foreground/80">Theme preset</label>
                <input
                  className="dm-input-xs dm-focus"
                  value={appearance.theme}
                  onChange={(e) => setAppearance((a) => ({ ...a, theme: e.target.value }))}
                  placeholder="default"
                />
              </div>
            </div>
          </section>

          <section className="dm-card p-6 space-y-4">
            <h2 className="text-sm font-semibold tracking-tight">Metadata (JSON)</h2>
            <p className="text-xs text-muted">
              Custom key/value data for integrations, SEO notes, or display hints. Must be a JSON object.
            </p>
            <textarea
              className="dm-textarea-xs dm-focus min-h-[160px] font-mono text-xs"
              value={appearance.metadataJson}
              onChange={(e) => setAppearance((a) => ({ ...a, metadataJson: e.target.value }))}
              spellCheck={false}
            />
          </section>

          <div className="flex justify-end pb-4">
            <button
              type="submit"
              disabled={savingAppearance}
              className="dm-pill dm-focus bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {savingAppearance ? "Saving…" : "Save appearance"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
