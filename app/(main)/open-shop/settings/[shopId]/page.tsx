"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiShops, apiAiContext } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import Image from "next/image";

function slugFromName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "shop";
}

export default function ShopSettingsPage() {
  const params = useParams();
  const shopId = typeof params.shopId === "string" ? params.shopId : "";

  const [shop, setShop] = useState<apiShops.Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [locationDisplay, setLocationDisplay] = useState("");
  const [shopType, setShopType] = useState<apiShops.ShopType>("product");

  const [contextEntries, setContextEntries] = useState<apiAiContext.AiContextEntry[]>([]);
  const [newContextType, setNewContextType] = useState("policy");
  const [newContextContent, setNewContextContent] = useState("");
  const [addingContext, setAddingContext] = useState(false);

  function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("midora_access_token");
  }

  useEffect(() => {
    if (!shopId) return;
    const token = getToken();
    if (!token) {
      setLoading(false);
      setError("Please log in to manage shop settings.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [shopData, contextList] = await Promise.all([
          apiShops.getShop(shopId),
          apiAiContext.listAiContext(token, shopId),
        ]);
        if (cancelled) return;
        setShop(shopData);
        setName(shopData.name ?? "");
        setSlug(shopData.slug ?? "");
        setDescription(shopData.description ?? "");
        setAbout(shopData.about ?? "");
        setLogoUrl(shopData.logo_url ?? "");
        setShopEmail(shopData.shop_email ?? "");
        setWhatsappNumber(shopData.whatsapp_number ?? "");
        const loc = shopData.location;
        setLocationDisplay(
          typeof loc === "string" ? loc : (typeof loc === "object" && loc !== null && "display" in loc ? String((loc as { display?: string }).display ?? "") : "")
        );
        setShopType((shopData.shop_type as apiShops.ShopType) ?? "product");
        setContextEntries(contextList);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load shop.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shopId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId) return;
    const token = getToken();
    if (!token) {
      setError("Please log in again.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const updated = await apiShops.updateShop(token, shopId, {
        name: name.trim(),
        slug: slug.trim() ? slugFromName(slug) : slugFromName(name),
        description: description.trim() || undefined,
        about: about.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        shop_email: shopEmail.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
        location: locationDisplay.trim() ? { display: locationDisplay.trim() } : undefined,
        shop_type: shopType,
      });
      setShop(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddContext(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId || !newContextContent.trim()) return;
    const token = getToken();
    if (!token) return;
    setAddingContext(true);
    setError(null);
    try {
      const entry = await apiAiContext.createAiContext(token, shopId, {
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
    return (
      <div className="dm-card p-6">
        <p className="text-sm text-muted">Loading shop settings…</p>
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="dm-card p-6">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/open-shop" className="mt-3 inline-block text-sm font-semibold text-foreground/80 hover:text-foreground">Back to Open shop</Link>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Shop settings</h1>
            <p className="mt-1 text-sm text-muted">{shop.name}</p>
          </div>
          <Link href={`/shops/${encodeURIComponent(shop.slug)}`} className="dm-pill dm-focus border border-border bg-surface text-foreground/85 hover:bg-primary/5 px-4 py-2 text-sm font-semibold">
            View shop
          </Link>
        </div>

        {error && <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">{error}</p>}

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Shop name *</label>
              <input className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-sm dm-focus" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Slug (URL) *</label>
              <input className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-sm dm-focus" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Description</label>
              <input className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-sm dm-focus" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">About</label>
              <textarea className="min-h-[80px] w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm dm-focus" value={about} onChange={(e) => setAbout(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Logo</label>
              <ImageUpload
                endpoint="shopLogo"
                onUploadComplete={setLogoUrl}
                label="Upload logo"
                previewUrl={logoUrl || undefined}
              />
              {logoUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-background">
                    <Image
                      src={logoUrl}
                      alt="Shop logo"
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Shop type</label>
              <select className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-sm dm-focus" value={shopType} onChange={(e) => setShopType(e.target.value as apiShops.ShopType)}>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Shop email</label>
              <input type="email" className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-sm dm-focus" value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">WhatsApp</label>
              <input className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-sm dm-focus" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Location</label>
              <input className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-sm dm-focus" value={locationDisplay} onChange={(e) => setLocationDisplay(e.target.value)} placeholder="e.g. Kampala, Uganda" />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={saving} className="dm-pill dm-focus bg-primary text-primary-foreground hover:opacity-95 px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="dm-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">AI concierge context</h2>
        <p className="mt-1 text-sm text-muted">Policies, FAQs, and notes the in-shop concierge uses to answer questions.</p>
        <ul className="mt-4 space-y-2">
          {contextEntries.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-border bg-surface/50 px-3 py-2 text-xs">
              <span className="font-medium text-foreground/80">{entry.context_type ?? entry.key ?? "context"}:</span>{" "}
              {(entry.content ?? entry.value ?? "").slice(0, 120)}{(entry.content ?? entry.value ?? "").length > 120 ? "…" : ""}
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddContext} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground/80">Type</label>
            <select className="mt-1 h-9 w-full max-w-[200px] rounded-2xl border border-border bg-surface px-3 text-sm dm-focus" value={newContextType} onChange={(e) => setNewContextType(e.target.value)}>
              <option value="policy">Policy</option>
              <option value="faq">FAQ</option>
              <option value="tone">Tone / brief</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Content</label>
            <textarea className="mt-1 min-h-[100px] w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm dm-focus" value={newContextContent} onChange={(e) => setNewContextContent(e.target.value)} placeholder="e.g. We ship worldwide within 5–7 days." />
          </div>
          <button type="submit" disabled={addingContext || !newContextContent.trim()} className="dm-pill dm-focus border border-border bg-surface text-foreground/85 hover:bg-primary/5 px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {addingContext ? "Adding…" : "Add context"}
          </button>
        </form>
      </section>
    </div>
  );
}
