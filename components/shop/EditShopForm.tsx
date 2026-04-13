"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiShops, apiAuth } from "@/lib/api";
import type { Shop } from "@/lib/api/shops";
import { ImageUpload } from "@/components/image-upload";
import { locationDisplay } from "./shopUtils";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("midora_access_token");
}

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

export default function EditShopForm({ shop }: { shop: Shop }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [form, setForm] = useState<FormState>(shopToFormState(shop));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;

    apiShops
      .myShops(token)
      .then((result) => {
        if (cancelled) return;
        const owned = result.items.some((s) => s.id === shop.id);
        setIsOwner(owned);
        setAuthChecked(true);
      })
      .catch(() => {
        if (!cancelled) setAuthChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [shop.id]);

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

  if (!authChecked) {
    return (
      <div className="mx-auto w-full max-w-4xl">
      <div className="dm-card p-8 text-center">
        <p className="text-sm text-muted">Checking permissions…</p>
      </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="mx-auto w-full max-w-4xl">
      <div className="dm-card space-y-4 p-8 text-center">
        <AlertCircle className="mx-auto size-8 text-muted" />
        <p className="text-sm font-semibold">Access denied</p>
        <p className="text-xs text-muted">
          You must be the shop owner to edit this page.
        </p>
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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Edit shop</h1>
          <p className="mt-1 text-sm text-muted">
            Update your shop's details and settings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/shops/${shop.slug}`)}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground dm-focus rounded-xl px-2 py-1.5 transition-colors shrink-0"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 dark:bg-red-950/30 dark:border-red-900/50">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <section className="dm-card p-6 space-y-4">
          <h2 className="text-sm font-semibold tracking-tight">
            Basic information
          </h2>

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
              <label className="text-xs font-medium text-foreground/80">
                Short description
              </label>
              <input
                className="dm-input-xs dm-focus"
                placeholder="Tagline shown on the shop page"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">
                About
              </label>
              <textarea
                className="dm-textarea-xs dm-focus"
                placeholder="Longer description of your shop"
                value={form.about}
                onChange={(e) => set("about", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Shop type
              </label>
              <select
                className="dm-input-xs appearance-none pr-9 dm-focus"
                value={form.shopType}
                onChange={(e) =>
                  set("shopType", e.target.value as apiShops.ShopType)
                }
              >
                <option value="product">Products</option>
                <option value="service">Services</option>
                <option value="both">Products &amp; Services</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Location
              </label>
              <input
                className="dm-input-xs dm-focus"
                placeholder="e.g. Kampala, Uganda"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">
                Logo
              </label>
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

        {/* Contact */}
        <section className="dm-card p-6 space-y-4">
          <h2 className="text-sm font-semibold tracking-tight">
            Contact details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Shop email
              </label>
              <input
                type="email"
                className="dm-input-xs dm-focus"
                placeholder="hello@shop.com"
                value={form.shopEmail}
                onChange={(e) => set("shopEmail", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                WhatsApp number
              </label>
              <input
                className="dm-input-xs dm-focus"
                placeholder="+256700000000"
                value={form.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Availability */}
        <section className="dm-card p-6 space-y-4">
          <h2 className="text-sm font-semibold tracking-tight">
            Availability
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Open days
              </label>
              <input
                className="dm-input-xs dm-focus"
                placeholder="e.g. Mon – Fri"
                value={form.availabilityDays}
                onChange={(e) => set("availabilityDays", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Hours
              </label>
              <input
                className="dm-input-xs dm-focus"
                placeholder="e.g. 9 AM – 6 PM"
                value={form.availabilityHours}
                onChange={(e) => set("availabilityHours", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="dm-card p-6 space-y-4">
          <h2 className="text-sm font-semibold tracking-tight">
            Shop status
          </h2>
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
              <p className="text-xs font-medium text-foreground/90">
                Shop is active
              </p>
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
    </div>
  );
}
