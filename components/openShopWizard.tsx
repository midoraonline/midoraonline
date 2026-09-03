"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Loader2, ArrowRight, AlertCircle } from "lucide-react";

import { apiShops } from "@/lib/api";
import CategoryPicker from "@/components/CategoryPicker";
import { ImageUpload } from "@/components/image-upload";
import LocationInput from "@/components/LocationInput";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { useAppSession } from "@/lib/state";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { buildShopLocationPayload } from "@/components/shop/shopUtils";
import type { LatLng } from "@/lib/geo";

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    || "shop";
}

export default function OpenShopWizard() {
  const session = useAppSession();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [locationDisplay, setLocationDisplay] = useState("");
  const [locationCoords, setLocationCoords] = useState<LatLng | null>(null);
  const [shopType, setShopType] = useState<apiShops.ShopType>("product");
  const [category, setCategory] = useState("");

  async function handleCreateShop(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a shop name.");
      return;
    }
    if (!session.isAuthenticated) {
      setError("Please log in to open a shop.");
      return;
    }
    const finalSlug = slugFromName(name);
    if (!finalSlug) {
      setError("Shop name must contain at least one letter or number.");
      return;
    }

    setError(null);
    setCreating(true);
    try {
      const shop = await apiShops.createShop({
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || undefined,
        about: about.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        shop_email: shopEmail.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
        location: buildShopLocationPayload(locationDisplay, locationCoords) ?? undefined,
        shop_type: shopType,
        category: category.trim() || undefined,
        contacts: [],
        social_links: [],
      });
      // Refresh session so the navbar reflects the new merchant role.
      notifyAuthChanged();
      // Immediately redirect to verification
      router.push(`/merchant/shops/${shop.id}/verification`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your shop. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border/80 pb-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
          <Store className="size-6" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">Manual Storefront Setup</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Enter your business information below. You will be taken straight to verification after publishing.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--error)]/30 bg-[color:var(--error)]/10 px-4 py-3 text-xs font-medium text-[color:var(--error)]">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCreateShop} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Shop Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="wizard-shop-name" className="text-xs font-semibold uppercase tracking-wider text-muted">
              Shop Name <span className="text-[color:var(--error)]">*</span>
            </label>
            <input
              id="wizard-shop-name"
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm font-medium dm-focus transition-all"
              placeholder="e.g. Kampala Gourmet Bakery"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {name.trim() && (
              <p className="text-[11px] text-muted">
                Public URL: <span className="font-mono font-medium text-foreground">midora.co/shops/{slugFromName(name)}</span>
              </p>
            )}
          </div>

          {/* Tagline */}
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="wizard-shop-desc" className="text-xs font-semibold uppercase tracking-wider text-muted">
              Short Description / Tagline
            </label>
            <input
              id="wizard-shop-desc"
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm dm-focus transition-all"
              placeholder="e.g. Freshly baked cakes, pastries & custom treats delivered daily"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={160}
            />
          </div>

          {/* About */}
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="wizard-shop-about" className="text-xs font-semibold uppercase tracking-wider text-muted">
              About Business
            </label>
            <textarea
              id="wizard-shop-about"
              className="min-h-[100px] w-full rounded-2xl border border-border bg-background p-4 text-sm dm-focus transition-all"
              placeholder="Tell buyers your business story, specialty products, opening hours, or delivery policies…"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </div>

          {/* Shop Type */}
          <div className="space-y-1.5">
            <label htmlFor="wizard-shop-type" className="text-xs font-semibold uppercase tracking-wider text-muted">
              Offering Type
            </label>
            <select
              id="wizard-shop-type"
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm dm-focus transition-all"
              value={shopType}
              onChange={(e) => setShopType(e.target.value as apiShops.ShopType)}
            >
              <option value="product">Products</option>
              <option value="service">Services</option>
              <option value="both">Both Products & Services</option>
            </select>
          </div>

          {/* Shop Category */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              Primary Business Category
            </label>
            <div className="rounded-2xl border border-border bg-background p-4">
              <CategoryPicker
                value={category}
                onChange={setCategory}
                compact
                idPrefix="open-shop-wizard-category"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              Storefront Logo
            </label>
            <ImageUpload
              endpoint="shopLogo"
              onUploadComplete={setLogoUrl}
              label="Upload logo image"
              previewUrl={logoUrl || undefined}
            />
          </div>

          {/* Contact Details */}
          <div className="space-y-1.5">
            <label htmlFor="wizard-shop-email" className="text-xs font-semibold uppercase tracking-wider text-muted">
              Business Email
            </label>
            <input
              id="wizard-shop-email"
              type="email"
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm dm-focus transition-all"
              placeholder="hello@yourshop.com"
              value={shopEmail}
              onChange={(e) => setShopEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              WhatsApp Contact Number
            </label>
            <PhoneNumberInput
              value={whatsappNumber}
              onChange={setWhatsappNumber}
              placeholder="700 000 000"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              Physical Location / Town
            </label>
            <LocationInput
              value={locationDisplay}
              onChange={setLocationDisplay}
              onResolved={(place) =>
                setLocationCoords(place ? { lat: place.lat, lng: place.lng } : null)
              }
              placeholder="e.g. Ntinda Shopping Centre, Kampala"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-border/80">
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:scale-[1.01] disabled:opacity-50 disabled:pointer-events-none"
          >
            {creating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Creating Shop…</span>
              </>
            ) : (
              <>
                <span>Publish Shop</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
