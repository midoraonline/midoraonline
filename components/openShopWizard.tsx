"use client";

import { useState } from "react";
import { apiShops, apiAiContext } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";

type Step = 1 | 2 | 3;

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    || "shop";
}

export default function OpenShopWizard() {
  const [step, setStep] = useState<Step>(1);
  const [creating, setCreating] = useState(false);
  const [savingContext, setSavingContext] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [locationDisplay, setLocationDisplay] = useState("");
  const [shopType, setShopType] = useState<apiShops.ShopType>("product");

  const [contextContent, setContextContent] = useState(
    "We sell quality products. Answer in a friendly, concise tone and mention our shop name when helpful."
  );

  const [createdShop, setCreatedShop] = useState<apiShops.Shop | null>(null);

  function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("midora_access_token");
  }


  async function handleCreateShop(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a shop name.");
      return;
    }
    const token = getToken();
    if (!token) {
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
      const shop = await apiShops.createShop(token, {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || undefined,
        about: about.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        shop_email: shopEmail.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
        location: locationDisplay.trim() ? { display: locationDisplay.trim() } : undefined,
        shop_type: shopType,
        contacts: [],
        social_links: [],
      });
      setCreatedShop(shop);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your shop. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveContext(e: React.FormEvent) {
    e.preventDefault();
    if (!createdShop) return;
    const token = getToken();
    if (!token) {
      setError("Please log in again to continue.");
      return;
    }
    if (!contextContent.trim()) {
      setError("Please add a short brief for the AI concierge.");
      return;
    }
    setError(null);
    setSavingContext(true);
    try {
      await apiAiContext.createAiContext(token, createdShop.id, {
        context_type: "policy",
        content: contextContent.trim(),
      });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save AI context. Please try again.");
    } finally {
      setSavingContext(false);
    }
  }

  return (
    <div className="dm-card p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Set up manually</h2>
          <p className="mt-1 text-sm text-muted">
            Fill in your shop details, add a logo, and give the AI concierge a brief.
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted">
          <span className={"inline-flex rounded-full border px-2 py-1 text-[11px] " + (step === 1 ? "border-foreground text-foreground" : "border-border")}>1 · Details</span>
          <span className={"inline-flex rounded-full border px-2 py-1 text-[11px] " + (step === 2 ? "border-foreground text-foreground" : "border-border")}>2 · AI concierge</span>
          <span className={"inline-flex rounded-full border px-2 py-1 text-[11px] " + (step === 3 ? "border-foreground text-foreground" : "border-border")}>3 · Done</span>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">{error}</p>
      )}

      {step === 1 && (
        <form onSubmit={handleCreateShop} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Shop name *</label>
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="e.g. My Coffee Shop"
                value={name}
                onChange={(e) => { const v = e.target.value; setName(v); setSlug(slugFromName(v)); }}
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
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="+256700000000"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Location (optional)</label>
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="e.g. Kampala, Uganda"
                value={locationDisplay}
                onChange={(e) => setLocationDisplay(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creating}
              className="dm-pill dm-focus bg-foreground text-background hover:opacity-95 px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create shop"}
            </button>
          </div>
        </form>
      )}

      {step === 2 && createdShop && (
        <form onSubmit={handleSaveContext} className="space-y-4">
          <p className="text-sm font-semibold">AI concierge brief</p>
          <p className="text-xs text-muted">
            This is stored as context for <span className="font-semibold">{createdShop.name}</span>. The in-shop concierge uses it to answer questions.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">Content (policy / FAQ / tone)</label>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs dm-focus"
              value={contextContent}
              onChange={(e) => setContextContent(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-2 pt-2">
            <button type="button" onClick={() => setStep(1)} className="text-xs text-muted hover:text-foreground dm-focus rounded-full px-3 py-1.5">Back</button>
            <button type="submit" disabled={savingContext} className="dm-pill dm-focus bg-foreground text-background hover:opacity-95 px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
              {savingContext ? "Saving…" : "Save & finish"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && createdShop && (
        <div className="space-y-4">
          <p className="text-sm font-semibold">You’re all set</p>
          <p className="text-xs text-muted">Your shop is live. Add products and share your link.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href={`/shops/${encodeURIComponent(createdShop.slug)}`} className="dm-pill dm-focus bg-foreground text-background hover:opacity-95 px-4 py-2.5 text-sm text-center font-semibold">
              View my shop
            </a>
            <a href={`/open-shop/settings/${createdShop.id}`} className="dm-pill dm-focus border border-border bg-surface text-foreground/85 hover:bg-foreground/5 px-4 py-2.5 text-sm text-center font-semibold">
              Shop settings
            </a>
            <a href={`/chat?shop_id=${encodeURIComponent(createdShop.id)}`} className="dm-pill dm-focus border border-border bg-surface text-foreground/85 hover:bg-foreground/5 px-4 py-2.5 text-sm text-center font-semibold sm:col-span-2">
              Chat with concierge
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
