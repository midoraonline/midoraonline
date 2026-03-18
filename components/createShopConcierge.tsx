"use client";

import { useEffect, useState } from "react";
import { apiChat, apiShops } from "@/lib/api";
import type { SuggestedShop } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";

type ChatLine = { id: string; role: "user" | "assistant"; content: string };

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    || "shop";
}

type ConfirmForm = {
  name: string;
  description: string;
  about: string;
  logoUrl: string;
  shopEmail: string;
  whatsappNumber: string;
  locationDisplay: string;
  shop_type: string;
};

const emptyConfirmForm: ConfirmForm = {
  name: "",
  description: "",
  about: "",
  logoUrl: "",
  shopEmail: "",
  whatsappNumber: "",
  locationDisplay: "",
  shop_type: "product",
};

export default function CreateShopConcierge({
  onShopCreated,
}: {
  onShopCreated: (shop: apiShops.Shop) => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedShop, setSuggestedShop] = useState<SuggestedShop | null>(null);
  const [confirmForm, setConfirmForm] = useState<ConfirmForm>(emptyConfirmForm);

  function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("midora_access_token");
  }

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setError("Please log in to use the quick start.");
      return () => {};
    }

    (async () => {
      try {
        const session = await apiChat.createSession({ intent: "create_shop" }, token);
        if (cancelled) return;
        setSessionId(session.id);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not start.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !input.trim()) return;
    const token = getToken();
    const text = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await apiChat.sendMessage(sessionId, { message: text }, token ?? undefined);
      const reply = res.message ?? "";
      if (reply) {
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: reply }]);
      }
      if (res.suggested_shop) {
        const s = res.suggested_shop;
        setSuggestedShop(s);
        setConfirmForm({
          ...emptyConfirmForm,
          name: s.name ?? "",
          description: s.description ?? "",
          shop_type: s.shop_type ?? "product",
          logoUrl: s.logo_url ?? "",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFromSuggestion(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setError("Please log in again.");
      return;
    }
    const { name, description, about, logoUrl, shopEmail, whatsappNumber, locationDisplay, shop_type } = confirmForm;
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const shop = await apiShops.createShop(token, {
        name: name.trim(),
        slug: slugFromName(name),
        description: description.trim() || undefined,
        about: about.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        shop_email: shopEmail.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
        location: locationDisplay.trim() ? { display: locationDisplay.trim() } : undefined,
        shop_type: shop_type as apiShops.ShopType,
        contacts: [],
        social_links: [],
      });
      onShopCreated(shop);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create shop.");
    } finally {
      setCreating(false);
    }
  }

  if (!sessionId && !error) {
    return <p className="text-sm text-muted">Starting create-shop assistant…</p>;
  }

  if (error && !sessionId) {
    return (
      <p className="text-sm text-red-600 rounded-2xl border border-red-100 bg-red-50 px-3 py-2">
        {error}
      </p>
    );
  }

  if (suggestedShop) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold">Fill in the rest and create your shop</p>
        <p className="text-xs text-muted">The AI suggested name, description, and type. Add logo, contact, and location if you like.</p>
        <form onSubmit={handleCreateFromSuggestion} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Shop name *</label>
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="e.g. My Coffee Shop"
                value={confirmForm.name}
                onChange={(e) => setConfirmForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Description (optional)</label>
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="Short tagline"
                value={confirmForm.description}
                onChange={(e) => setConfirmForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">About (optional)</label>
              <textarea
                className="min-h-[80px] w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs dm-focus"
                placeholder="Longer description"
                value={confirmForm.about}
                onChange={(e) => setConfirmForm((f) => ({ ...f, about: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Logo (optional)</label>
              <ImageUpload
                endpoint="shopLogo"
                onUploadComplete={(url) => setConfirmForm((f) => ({ ...f, logoUrl: url }))}
                label="Upload logo"
                previewUrl={confirmForm.logoUrl || undefined}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">Shop type</label>
              <select
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                value={confirmForm.shop_type}
                onChange={(e) => setConfirmForm((f) => ({ ...f, shop_type: e.target.value }))}
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
                value={confirmForm.shopEmail}
                onChange={(e) => setConfirmForm((f) => ({ ...f, shopEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">WhatsApp (optional)</label>
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="+256700000000"
                value={confirmForm.whatsappNumber}
                onChange={(e) => setConfirmForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">Location (optional)</label>
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="e.g. Kampala, Uganda"
                value={confirmForm.locationDisplay}
                onChange={(e) => setConfirmForm((f) => ({ ...f, locationDisplay: e.target.value }))}
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="pt-2">
            <button
              type="submit"
              disabled={creating}
              className="dm-pill dm-focus bg-foreground text-background hover:opacity-95 px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create shop"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="min-h-[200px] max-h-[280px] overflow-y-auto rounded-2xl border border-border bg-background px-3 py-2 space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-muted">Tell the assistant what kind of shop you want (e.g. bakery, clothing store).</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  "max-w-[85%] rounded-2xl px-3 py-2 text-xs " +
                  (m.role === "user" ? "bg-foreground text-background" : "bg-foreground/5 text-foreground/90")
                }
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="h-9 flex-1 rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
          placeholder="e.g. I want to open a bakery…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-9 px-3 rounded-2xl bg-foreground text-background text-xs font-semibold dm-focus disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
