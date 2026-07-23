"use client";

import { useState } from "react";
import { apiShops } from "@/lib/api";
import CategoryPicker from "@/components/CategoryPicker";
import { ImageUpload } from "@/components/image-upload";
import LocationInput from "@/components/LocationInput";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { useAppSession } from "@/lib/state";
import { notifyAuthChanged } from "@/lib/auth/token-storage";

import { useRouter } from "next/navigation";

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
        location: locationDisplay.trim() && locationDisplay.trim() !== "Online Shop" ? { display: locationDisplay.trim() } : undefined,
        shop_type: shopType,
        category: category.trim() || undefined,
        contacts: [],
        social_links: [],
      });
      // Refresh session so the navbar reflects the new merchant role.
      notifyAuthChanged();
      // Immediately redirect to verification — do not block on optional AI context setup.
      router.push(`/merchant/shops/${shop.id}/verification`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your shop. Please try again.");
    } finally {
      setCreating(false);
    }
  }


  return (
    <div className="dm-card p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Set up manually</h2>
        <p className="mt-1 text-sm text-muted">
          Fill in your shop details and logo. You'll be taken straight to verification after.
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">{error}</p>
      )}

      <form onSubmit={handleCreateShop} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Shop name *</label>
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="e.g. My Coffee Shop"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Description (optional)</label>
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="Short tagline"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">About (optional)</label>
              <textarea
                className="min-h-[80px] w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs dm-focus"
                placeholder="Longer description"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Logo (optional)</label>
              <ImageUpload
                endpoint="shopLogo"
                onUploadComplete={setLogoUrl}
                label="Upload logo"
                previewUrl={logoUrl || undefined}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Shop category</label>
              <div className="rounded-2xl border border-border bg-surface p-3">
                <CategoryPicker
                  value={category}
                  onChange={setCategory}
                  compact
                  idPrefix="open-shop-category"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Shop type</label>
              <select
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                value={shopType}
                onChange={(e) => setShopType(e.target.value as apiShops.ShopType)}
              >
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Shop email (optional)</label>
              <input
                type="email"
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="hello@shop.com"
                value={shopEmail}
                onChange={(e) => setShopEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">WhatsApp (optional)</label>
              <PhoneNumberInput
                value={whatsappNumber}
                onChange={setWhatsappNumber}
                placeholder="700 000 000"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Location (optional)</label>
              <LocationInput
                value={locationDisplay}
                onChange={setLocationDisplay}
                placeholder="e.g. Kisasi, Kampala"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creating}
              className="dm-pill dm-focus bg-primary text-primary-foreground hover:opacity-95 px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create shop"}
            </button>
          </div>
        </form>

    </div>
  );
}
