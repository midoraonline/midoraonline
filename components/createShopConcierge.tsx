"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { apiChat, apiShops } from "@/lib/api";
import type { SuggestedShop } from "@/lib/api/chat";
import CategoryPicker from "@/components/CategoryPicker";
import { ImageUpload } from "@/components/image-upload";
import LocationInput from "@/components/LocationInput";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { useAppSession } from "@/lib/state";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import { buildShopLocationPayload } from "@/components/shop/shopUtils";
import type { LatLng } from "@/lib/geo";

const STARTER_PROMPTS = [
  "I bake cakes and pastries in Kampala — home delivery available",
  "Phone accessories and repairs shop in Ntinda",
  "I offer cleaning and laundry services across Wakiso",
  "Land and rental listings around Entebbe Road",
] as const;

type ChatLine = { id: string; role: "user" | "assistant"; content: string };

function slugFromName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "shop"
  );
}

type ConfirmForm = {
  name: string;
  slug: string;
  description: string;
  about: string;
  logoUrl: string;
  shopEmail: string;
  whatsappNumber: string;
  locationDisplay: string;
  category: string;
  availability: string;
  shop_type: string;
};

function fromSuggestion(s: SuggestedShop): ConfirmForm {
  return {
    name: s.name ?? "",
    slug: s.slug ?? slugFromName(s.name ?? ""),
    description: s.description ?? "",
    about: s.about ?? "",
    logoUrl: s.logo_url ?? "",
    shopEmail: s.shop_email ?? "",
    whatsappNumber: s.whatsapp_number ?? "",
    locationDisplay: s.location ?? "",
    category: s.category ?? "",
    availability: s.availability ?? "",
    shop_type: s.shop_type ?? "product",
  };
}

function AISuggestion({
  label,
  value,
  onAccept,
  onEdit,
}: {
  label: string;
  value: string;
  onAccept: () => void;
  onEdit: () => void;
}) {
  if (!value.trim()) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
      <span className="mt-0.5 shrink-0 text-primary">✦</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground/80">AI suggestion for {label}</p>
        <p className="mt-1 text-foreground/70">{value}</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
          >
            Use this
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold hover:bg-foreground/[0.04]"
          >
            I&apos;ll edit it
          </button>
        </div>
      </div>
    </div>
  );
}

function ShopPreview({ form }: { form: ConfirmForm }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-primary p-5 text-white">
      <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-accent/25 blur-2xl" />
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
        Shop preview
      </p>
      <p className="relative mt-2 font-display text-xl font-semibold tracking-tight">
        {form.name || "Your shop name"}
      </p>
      {form.description ? (
        <p className="relative mt-1 text-sm text-white/70">{form.description}</p>
      ) : null}
      <div className="relative mt-3 flex flex-wrap gap-2 text-[11px]">
        {form.shop_type ? (
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 capitalize text-white/85">
            {form.shop_type}
          </span>
        ) : null}
        {form.category ? (
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-white/85">
            {form.category}
          </span>
        ) : null}
        {form.locationDisplay ? (
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-white/85">
            {form.locationDisplay}
          </span>
        ) : null}
        {form.availability ? (
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-white/85">
            {form.availability}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function CreateShopConcierge({
  onShopCreated,
}: {
  onShopCreated: (shop: apiShops.Shop) => void;
}) {
  const appSession = useAppSession();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestedShop, setSuggestedShop] = useState<SuggestedShop | null>(null);
  const [confirmForm, setConfirmForm] = useState<ConfirmForm | null>(null);
  const [locationCoords, setLocationCoords] = useState<LatLng | null>(null);
  const [pendingSuggestions, setPendingSuggestions] = useState<
    Set<keyof ConfirmForm>
  >(new Set());

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!appSession.hydrated) return;
    if (!appSession.isAuthenticated) {
      setError("Please log in to use the quick start.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const session = await apiChat.createSession({ intent: "create_shop" });
        if (cancelled) return;
        setSessionId(session.id);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not start.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appSession.hydrated, appSession.isAuthenticated]);

  async function sendMessage(raw: string) {
    if (!sessionId || !raw.trim() || loading) return;
    const text = raw.trim();
    const userId = `u-${Date.now()}`;
    const pendingId = `a-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setInput("");
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: text },
      { id: pendingId, role: "assistant", content: "Thinking…" },
    ]);
    setLoading(true);

    try {
      const res = await apiChat.sendMessage(sessionId, { message: text });
      const reply = res.message ?? "";
      setMessages((prev) =>
        reply
          ? prev.map((m) =>
              m.id === pendingId ? { ...m, content: reply } : m,
            )
          : prev.filter((m) => m.id !== pendingId),
      );

      if (res.suggested_shop) {
        const s = res.suggested_shop;
        setSuggestedShop(s);
        const form = fromSuggestion(s);
        setConfirmForm(form);
        setLocationCoords(null);
        const suggested: Set<keyof ConfirmForm> = new Set();
        (
          [
            "description",
            "about",
            "category",
            "availability",
          ] as (keyof ConfirmForm)[]
        ).forEach((key) => {
          if (form[key]?.toString().trim()) suggested.add(key);
        });
        setPendingSuggestions(suggested);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setMessages((prev) => prev.filter((m) => m.id !== pendingId));
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!appSession.isAuthenticated || !confirmForm) {
      setError("Please log in again.");
      return;
    }
    if (!confirmForm.name.trim()) {
      setError("Shop name is required.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const shop = await apiShops.createShop({
        name: confirmForm.name.trim(),
        slug: confirmForm.slug.trim() || slugFromName(confirmForm.name),
        description: confirmForm.description.trim() || undefined,
        about: confirmForm.about.trim() || undefined,
        logo_url: confirmForm.logoUrl.trim() || undefined,
        shop_email: confirmForm.shopEmail.trim() || undefined,
        whatsapp_number: confirmForm.whatsappNumber.trim() || undefined,
        location: buildShopLocationPayload(
          confirmForm.locationDisplay,
          locationCoords,
        ) ?? undefined,
        availability: confirmForm.availability.trim()
          ? { hours: confirmForm.availability.trim() }
          : undefined,
        shop_type: confirmForm.shop_type as apiShops.ShopType,
        category: confirmForm.category.trim() || undefined,
        contacts: [],
        social_links: [],
      });
      notifyAuthChanged();
      onShopCreated(shop);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create shop.");
    } finally {
      setCreating(false);
    }
  }

  function acceptSuggestion(field: keyof ConfirmForm) {
    setPendingSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }

  function dismissSuggestion(field: keyof ConfirmForm) {
    setConfirmForm((f) => (f ? { ...f, [field]: "" } : f));
    setPendingSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }

  function field(key: keyof ConfirmForm, value: string) {
    setConfirmForm((f) => (f ? { ...f, [key]: value } : f));
    setPendingSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  if (!sessionId && !error) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted">
        <Loader2 className="size-4 animate-spin text-accent" aria-hidden />
        Starting AI shop assistant…
      </div>
    );
  }
  if (error && !sessionId) {
    return (
      <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (suggestedShop && confirmForm) {
    const f = confirmForm;
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold">Review your shop details</p>
          <p className="mt-1 text-xs text-muted">
            The assistant filled in what it could. Review, edit, and add
            anything missing — then hit Create.
          </p>
        </div>

        <ShopPreview form={f} />

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Shop name *
              </label>
              <input
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm dm-focus"
                value={f.name}
                onChange={(e) => field("name", e.target.value)}
                placeholder="e.g. Kampala Bakes"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                URL slug *
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted">/shops/</span>
                <input
                  className="h-9 flex-1 rounded-xl border border-border bg-background px-3 text-sm dm-focus"
                  value={f.slug}
                  onChange={(e) =>
                    field(
                      "slug",
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  placeholder="kampala-bakes"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Short tagline
              </label>
              {pendingSuggestions.has("description") ? (
                <AISuggestion
                  label="tagline"
                  value={f.description}
                  onAccept={() => acceptSuggestion("description")}
                  onEdit={() => dismissSuggestion("description")}
                />
              ) : (
                <input
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm dm-focus"
                  value={f.description}
                  onChange={(e) => field("description", e.target.value)}
                  placeholder="One line that describes your shop"
                  maxLength={160}
                />
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                About
              </label>
              {pendingSuggestions.has("about") ? (
                <AISuggestion
                  label="about"
                  value={f.about}
                  onAccept={() => acceptSuggestion("about")}
                  onEdit={() => dismissSuggestion("about")}
                />
              ) : (
                <textarea
                  className="min-h-[90px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm dm-focus"
                  value={f.about}
                  onChange={(e) => field("about", e.target.value)}
                  placeholder="Tell customers more about your business story, specialties, and values…"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Type
              </label>
              <select
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm dm-focus"
                value={f.shop_type}
                onChange={(e) => field("shop_type", e.target.value)}
              >
                <option value="product">Products</option>
                <option value="service">Services</option>
                <option value="both">Products & services</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Category
              </label>
              {pendingSuggestions.has("category") ? (
                <AISuggestion
                  label="category"
                  value={f.category}
                  onAccept={() => acceptSuggestion("category")}
                  onEdit={() => dismissSuggestion("category")}
                />
              ) : (
                <div className="rounded-xl border border-border bg-white p-3 sm:p-4">
                  <CategoryPicker
                    value={f.category}
                    onChange={(v) => field("category", v)}
                    compact
                    idPrefix="shop-category"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Logo
              </label>
              <ImageUpload
                endpoint="shopLogo"
                onUploadComplete={(url) => field("logoUrl", url)}
                label="Upload logo"
                previewUrl={f.logoUrl || undefined}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Shop email
              </label>
              <input
                type="email"
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm dm-focus"
                value={f.shopEmail}
                onChange={(e) => field("shopEmail", e.target.value)}
                placeholder="hello@yourshop.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                WhatsApp
              </label>
              <PhoneNumberInput
                value={f.whatsappNumber}
                onChange={(val) => field("whatsappNumber", val)}
                placeholder="700 000 000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Location
              </label>
              <LocationInput
                value={f.locationDisplay}
                onChange={(v) => field("locationDisplay", v)}
                onResolved={(place) =>
                  setLocationCoords(place ? { lat: place.lat, lng: place.lng } : null)
                }
                placeholder="e.g. Kisasi, Kampala"
                className="pt-1"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Hours / availability
              </label>
              {pendingSuggestions.has("availability") ? (
                <AISuggestion
                  label="availability"
                  value={f.availability}
                  onAccept={() => acceptSuggestion("availability")}
                  onEdit={() => dismissSuggestion("availability")}
                />
              ) : (
                <input
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm dm-focus"
                  value={f.availability}
                  onChange={(e) => field("availability", e.target.value)}
                  placeholder="e.g. Mon–Fri 9am–6pm"
                />
              )}
            </div>
          </div>

          {error ? (
            <p className="text-xs text-red-600">{error}</p>
          ) : null}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-colors hover:bg-accent-hover disabled:opacity-60 sm:flex-none"
            >
              {creating ? "Creating your shop…" : "Create shop"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSuggestedShop(null);
                setConfirmForm(null);
                setLocationCoords(null);
              }}
              className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-foreground/[0.04]"
            >
              Keep chatting
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex min-h-[280px] max-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-inner">
        <div className="flex items-center gap-2 border-b border-border/80 bg-surface-subtle/50 px-3 py-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-accent/15 text-accent">
            <Sparkles className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Midora assistant</p>
            <p className="text-[10px] text-muted">Drafts your shop from a short description</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4">
          {messages.length === 0 ? (
            <div className="space-y-3 py-2">
              <p className="text-sm leading-relaxed text-foreground/80">
                Tell me what you sell or offer, where you are, and any specialty.
                I&apos;ll propose a shop name, slug, and story you can edit.
              </p>
              <div className="flex flex-wrap gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={loading || !sessionId}
                    onClick={() => void sendMessage(prompt)}
                    className="max-w-full rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1.5 text-left text-[11px] font-medium text-foreground/80 transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={
                    "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed " +
                    (m.role === "user"
                      ? "rounded-br-md bg-accent text-white shadow-sm shadow-accent/20"
                      : "rounded-bl-md border border-border bg-surface-subtle text-foreground/90")
                  }
                >
                  {m.content === "Thinking…" ? (
                    <span className="inline-flex items-center gap-2 text-muted">
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      Thinking…
                    </span>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {error ? (
          <p className="border-t border-border px-3 py-2 text-xs text-red-600">{error}</p>
        ) : null}

        <form
          onSubmit={handleSend}
          className="flex gap-2 border-t border-border bg-surface-subtle/40 p-2.5 sm:p-3"
        >
          <input
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 text-sm dm-focus"
            placeholder="Describe your business…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/25 transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
