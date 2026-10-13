"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SingleImageField } from "@/components/upload/SingleImageField";
import LocationInput from "@/components/LocationInput";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import VerifyContactButton from "@/components/VerifyContactButton";
import CategoryPicker from "@/components/CategoryPicker";
import { apiAiContext, apiShops } from "@/lib/api";
import { useAppSession } from "@/lib/state";
import {
  buildShopLocationPayload,
  locationCoords as readLocationCoords,
  shopBannerUrl,
  withBannerUrl,
} from "@/components/shop/shopUtils";
import type { LatLng } from "@/lib/geo";
import { isMaintenanceMode, MAINTENANCE_MESSAGE } from "@/lib/platformMessages";
import { BTN_PRIMARY, BTN_SECONDARY, ErrorState, PageSkeleton } from "@/components/dashboard/ui";

function slugFromName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "shop"
  );
}

const SETTINGS_ROW = "grid gap-5 rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8";

export default function MerchantShopSettingsPage() {
  const params = useParams();
  const shopId = typeof params.shopId === "string" ? params.shopId : "";
  const session = useAppSession();

  const [shop, setShop] = useState<apiShops.Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [locationDisplay, setLocationDisplay] = useState("");
  const [locationCoordsState, setLocationCoordsState] = useState<LatLng | null>(null);
  const [shopType, setShopType] = useState<apiShops.ShopType>("product");
  const [category, setCategory] = useState("");

  const [contextEntries, setContextEntries] = useState<apiAiContext.AiContextEntry[]>([]);
  const [newContextType, setNewContextType] = useState("policy");
  const [newContextContent, setNewContextContent] = useState("");
  const [addingContext, setAddingContext] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    if (!session.hydrated) return;
    if (!session.isAuthenticated) {
      setLoading(false);
      setError("Please log in to manage shop settings.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [shopData, contextList] = await Promise.all([
          apiShops.getShop(shopId),
          apiAiContext.listAiContext(shopId),
        ]);
        if (cancelled) return;
        setShop(shopData);
        setName(shopData.name ?? "");
        setSlug(shopData.slug ?? "");
        setDescription(shopData.description ?? "");
        setAbout(shopData.about ?? "");
        setLogoUrl(shopData.logo_url ?? "");
        setBannerUrl(shopBannerUrl(shopData.theme_config) ?? "");
        setShopEmail(shopData.shop_email ?? "");
        setWhatsappNumber(shopData.whatsapp_number ?? "");
        setWhatsappVerified(Boolean(shopData.whatsapp_verified));
        const loc = shopData.location;
        setLocationDisplay(
          typeof loc === "string"
            ? loc
            : typeof loc === "object" && loc !== null && "display" in loc
            ? String((loc as { display?: string }).display ?? "")
            : "",
        );
        setLocationCoordsState(readLocationCoords(loc));
        setShopType((shopData.shop_type as apiShops.ShopType) ?? "product");
        setCategory(shopData.category ?? "");
        setContextEntries(contextList);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load shop.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shopId, session.hydrated, session.isAuthenticated]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId || !session.isAuthenticated) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await apiShops.updateShop(shopId, {
        name: name.trim(),
        slug: slug.trim() ? slugFromName(slug) : slugFromName(name),
        description: description.trim() || undefined,
        about: about.trim() || undefined,
        logo_url: logoUrl.trim() || null,
        theme_config: withBannerUrl(shop?.theme_config ?? null, bannerUrl || null),
        shop_email: shopEmail.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
        location: buildShopLocationPayload(locationDisplay, locationCoordsState) ?? undefined,
        shop_type: shopType,
        category: category.trim() || undefined,
      });
      setShop(updated);
    } catch (err) {
      setError(isMaintenanceMode(err) ? MAINTENANCE_MESSAGE : err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddContext(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId || !newContextContent.trim() || !session.isAuthenticated) return;
    setAddingContext(true);
    setError(null);
    try {
      const entry = await apiAiContext.createAiContext(shopId, {
        context_type: newContextType,
        content: newContextContent.trim(),
      });
      setContextEntries((prev) => [...prev, entry]);
      setNewContextContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add context.");
    } finally {
      setAddingContext(false);
    }
  }

  if (loading) {
    return <PageSkeleton rows={6} label="Loading settings" />;
  }
  if (error && !shop) {
    return <ErrorState message={error} />;
  }
  if (!shop) return null;

  return (
    <div className="space-y-4">
      <section className={SETTINGS_ROW}>
        <div>
          <h2 className="text-sm font-semibold">Shop details</h2>
          <p className="mt-1 text-sm text-muted">What buyers see on your public shop page.</p>
        </div>
        <div className="min-w-0">
        {error ? <ErrorState message={error} /> : null}

        <form onSubmit={handleSave} className="max-w-3xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Shop name *</label>
              <input
                className="dm-input dm-focus"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Slug *</label>
              <input
                className="dm-input dm-focus"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <input
                className="dm-input dm-focus"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">About</label>
              <textarea
                className="dm-textarea !min-h-[80px] dm-focus"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Logo</label>
              <SingleImageField
                endpoint="shopLogo"
                value={logoUrl}
                onChange={(url) => setLogoUrl(url ?? "")}
                emptyLabel="Add logo"
                hint="Square works best. Shown on your shop and listing cards."
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Banner</label>
              <SingleImageField
                endpoint="shopBanner"
                shape="wide"
                value={bannerUrl}
                onChange={(url) => setBannerUrl(url ?? "")}
                emptyLabel="Add banner"
                hint="Wide image across the top of your shop page."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Shop type</label>
              <select
                className="dm-input appearance-none pr-10 dm-focus"
                value={shopType}
                onChange={(e) => setShopType(e.target.value as apiShops.ShopType)}
              >
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Category</label>
              <div className="rounded-xl border border-border bg-surface shadow-xs p-3">
                <CategoryPicker
                  value={category}
                  onChange={setCategory}
                  compact
                  idPrefix="merchant-shop-category"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Business email</label>
              <input
                type="email"
                className="dm-input dm-focus"
                value={shopEmail}
                onChange={(e) => setShopEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Business phone number</label>
              <PhoneNumberInput
                value={whatsappNumber}
                onChange={setWhatsappNumber}
                placeholder="700 000 000"
              />
              <VerifyContactButton
                value={whatsappNumber}
                verified={whatsappVerified}
                label="Business phone number"
                sendCode={() => apiShops.sendShopWhatsAppCode(shopId, whatsappNumber.trim())}
                confirmCode={async (code) => {
                  const updated = await apiShops.confirmShopWhatsAppCode(shopId, code);
                  setShop(updated);
                  setWhatsappNumber(updated.whatsapp_number ?? whatsappNumber);
                  setWhatsappVerified(Boolean(updated.whatsapp_verified));
                }}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Location</label>
              <LocationInput
                value={locationDisplay}
                onChange={setLocationDisplay}
                onResolved={(place) =>
                  setLocationCoordsState(place ? { lat: place.lat, lng: place.lng } : null)
                }
                placeholder="e.g. Kisasi, Kampala"
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className={BTN_PRIMARY}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
        </div>
      </section>

      <section className={SETTINGS_ROW}>
        <div>
          <h2 className="text-sm font-semibold">AI concierge context</h2>
          <p className="mt-1 text-sm text-muted">
            Policies, FAQs and notes the in-shop concierge uses to answer questions.
          </p>
        </div>
        <div className="min-w-0">
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface shadow-xs">
          {contextEntries.map((entry) => (
            <li
              key={entry.id}
              className="px-3 py-2 text-sm"
            >
              <span className="font-medium text-foreground/80">
                {entry.context_type ?? entry.key ?? "context"}:
              </span>{" "}
              {(entry.content ?? entry.value ?? "").slice(0, 120)}
              {(entry.content ?? entry.value ?? "").length > 120 ? "…" : ""}
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddContext} className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              className="dm-input mt-1 max-w-[220px] appearance-none pr-10 dm-focus"
              value={newContextType}
              onChange={(e) => setNewContextType(e.target.value)}
            >
              <option value="policy">Policy</option>
              <option value="faq">FAQ</option>
              <option value="tone">Tone / brief</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Content</label>
            <textarea
              className="dm-textarea mt-1 !min-h-[100px] dm-focus"
              value={newContextContent}
              onChange={(e) => setNewContextContent(e.target.value)}
              placeholder="e.g. We ship worldwide within 5–7 days."
            />
          </div>
          <button
            type="submit"
            disabled={addingContext || !newContextContent.trim()}
            className={BTN_SECONDARY}
          >
            {addingContext ? "Adding…" : "Add context"}
          </button>
        </form>
        </div>
      </section>
    </div>
  );
}
