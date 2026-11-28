"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SingleImageField } from "@/components/upload/SingleImageField";
import { SettingsActions, SettingsPanel, SettingsRow } from "@/components/settings/SettingsSection";
import LocationInput from "@/components/LocationInput";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import WhatsAppStatus from "@/components/shop/WhatsAppStatus";
import ExtraPhoneNumbers, {
  extraPhonesFromContacts,
  extraPhonesToContacts,
  type ExtraPhone,
} from "@/components/shop/ExtraPhoneNumbers";
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
import { isMaintenanceMode, MAINTENANCE_MESSAGE, platformActionMessage } from "@/lib/platformMessages";
import { BTN_PRIMARY, BTN_SECONDARY, ErrorState, PageSkeleton, UnderlineTabs, useTabParam } from "@/components/dashboard/ui";

const SETTINGS_TABS = [
  { value: "general", label: "General" },
  { value: "branding", label: "Logo and banner" },
  { value: "contact", label: "Contact and location" },
  { value: "assistant", label: "AI assistant" },
] as const;
const SETTINGS_KEYS = SETTINGS_TABS.map((t) => t.value);

function slugFromName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "shop"
  );
}


export default function MerchantShopSettingsPage() {
  const params = useParams();
  const shopId = typeof params.shopId === "string" ? params.shopId : "";
  const session = useAppSession();

  const [shop, setShop] = useState<apiShops.Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useTabParam(SETTINGS_KEYS, "general");
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
  const [extraPhones, setExtraPhones] = useState<ExtraPhone[]>([]);
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
      setError("Sign in to manage your shop settings.");
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
        setExtraPhones(extraPhonesFromContacts(shopData.contacts));
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
          setError(platformActionMessage(err, "We couldn't load your shop settings. Check your connection and try again."));
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
        whatsapp_number: whatsappNumber.trim() || null,
        contacts: extraPhonesToContacts(extraPhones),
        location: buildShopLocationPayload(locationDisplay, locationCoordsState) ?? undefined,
        shop_type: shopType,
        category: category.trim() || undefined,
      });
      setShop(updated);
      setWhatsappNumber(updated.whatsapp_number ?? "");
      setWhatsappVerified(Boolean(updated.whatsapp_verified));
      setExtraPhones(extraPhonesFromContacts(updated.contacts));
      toast.success("Saved. Your changes are live.");
    } catch (err) {
      setError(isMaintenanceMode(err) ? MAINTENANCE_MESSAGE : platformActionMessage(err, "We couldn't save your changes. Check your connection and try again."));
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
      setError(platformActionMessage(err, "We couldn't add this note. Try again."));
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
    <div>
      <UnderlineTabs tabs={SETTINGS_TABS} value={tab} onChange={setTab} />
      {tab === "assistant" ? (
        <SettingsPanel>
          <SettingsRow
            title="Notes for your AI assistant"
            description="Add your policies, common questions and other notes. The assistant on your shop page uses them to answer buyers."
          >
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface shadow-xs">
          {contextEntries.map((entry) => (
            <li
              key={entry.id}
              className="px-3 py-2 text-sm"
            >
              <span className="font-medium text-foreground/80">
                {entry.context_type ?? entry.key ?? "Note"}:
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
              <option value="faq">Common question</option>
              <option value="tone">Tone and style</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Note</label>
            <textarea
              className="dm-textarea mt-1 !min-h-[100px] dm-focus"
              value={newContextContent}
              onChange={(e) => setNewContextContent(e.target.value)}
              placeholder="e.g. We deliver within Kampala in 1–2 days."
            />
          </div>
          <button
            type="submit"
            disabled={addingContext || !newContextContent.trim()}
            className={BTN_SECONDARY}
          >
            {addingContext ? "Adding…" : "Add note"}
          </button>
        </form>
          </SettingsRow>
        </SettingsPanel>
      ) : (
        <form onSubmit={handleSave}>
          <SettingsPanel>
            {tab === "general" ? (
              <>
                <SettingsRow title="Name and link" description="Your shop name and the web address buyers use.">
                  <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Shop name</label>
              <input
                className="dm-input dm-focus"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Shop link</label>
              <input
                className="dm-input dm-focus"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
                  </div>
                </SettingsRow>
                <SettingsRow title="Description" description="A short line for listing cards, and a longer section about your shop for your shop page.">
                  <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Short description (optional)</label>
              <input
                className="dm-input dm-focus"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">About your shop (optional)</label>
              <textarea
                className="dm-textarea !min-h-[80px] dm-focus"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
              />
            </div>
                  </div>
                </SettingsRow>
                <SettingsRow title="Type and category" description="Helps buyers find you in search and the feed.">
                  <div className="grid gap-4">
            <div className="space-y-1.5 md:max-w-xs">
              <label className="text-sm font-medium">Shop type</label>
              <select
                className="dm-input appearance-none pr-10 dm-focus"
                value={shopType}
                onChange={(e) => setShopType(e.target.value as apiShops.ShopType)}
              >
                <option value="product">Products</option>
                <option value="service">Services</option>
                <option value="both">Products and services</option>
              </select>
            </div>
            <div className="space-y-1.5">
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
                  </div>
                </SettingsRow>
              </>
            ) : null}
            {tab === "branding" ? (
              <>
                <SettingsRow title="Logo" description="A square photo works best. It shows on your shop page and listing cards.">
            <div className="space-y-1.5">
              <SingleImageField
                endpoint="shopLogo"
                value={logoUrl}
                onChange={(url) => setLogoUrl(url ?? "")}
                emptyLabel="Add logo"
              />
            </div>
                </SettingsRow>
                <SettingsRow title="Banner" description="A wide photo across the top of your shop page.">
            <div className="space-y-1.5">
              <SingleImageField
                endpoint="shopBanner"
                shape="wide"
                value={bannerUrl}
                onChange={(url) => setBannerUrl(url ?? "")}
                emptyLabel="Add banner"
              />
            </div>
                </SettingsRow>
              </>
            ) : null}
            {tab === "contact" ? (
              <>
                <SettingsRow title="Shop contacts" description="How buyers reach you. Buyers see a WhatsApp button once you verify your number with a WhatsApp code.">
                  <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Shop email (optional)</label>
              <input
                type="email"
                className="dm-input dm-focus"
                value={shopEmail}
                onChange={(e) => setShopEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">WhatsApp number</label>
              <PhoneNumberInput
                value={whatsappNumber}
                onChange={setWhatsappNumber}
                placeholder="772 123 456"
              />
              <WhatsAppStatus
                shopId={shopId}
                savedNumber={(shop?.whatsapp_number ?? "").trim()}
                draftNumber={whatsappNumber}
                verified={whatsappVerified}
                registered={shop?.whatsapp_registered}
                onNumberSaved={(n) => {
                  setWhatsappNumber(n);
                  setWhatsappVerified(false);
                  setShop((s) => (s ? { ...s, whatsapp_number: n, whatsapp_verified: false, whatsapp_registered: null } : s));
                }}
                onVerified={(updated) => {
                  setShop(updated);
                  setWhatsappVerified(Boolean(updated.whatsapp_verified));
                }}
              />
            </div>
            <div className="md:col-span-2">
              <ExtraPhoneNumbers value={extraPhones} onChange={setExtraPhones} idPrefix="settings-extra-phone" />
            </div>
                  </div>
                </SettingsRow>
                <SettingsRow title="Location" description="Your area or town, and a landmark if it helps. It shows on your shop page and helps buyers nearby find you.">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Location</label>
              <LocationInput
                value={locationDisplay}
                onChange={setLocationDisplay}
                onResolved={(place) =>
                  setLocationCoordsState(place ? { lat: place.lat, lng: place.lng } : null)
                }
                placeholder="e.g. Kisasi, near Total, Kampala"
              />
            </div>
                </SettingsRow>
              </>
            ) : null}
        <SettingsActions>
          {error ? <p className="mr-auto text-sm text-[color:var(--error)]">{error}</p> : null}
          <button type="submit" disabled={saving} className={BTN_PRIMARY}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </SettingsActions>
          </SettingsPanel>
        </form>
      )}
    </div>
  );
}
