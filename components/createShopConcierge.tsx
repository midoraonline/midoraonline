"use client";

import { useEffect, useRef, useState } from "react";
import { apiChat, apiShops } from "@/lib/api";
import type { SuggestedShop } from "@/lib/api/chat";
import { ImageUpload } from "@/components/image-upload";
import { useAppSession } from "@/lib/state";
import { notifyAuthChanged } from "@/lib/auth/token-storage";

/* ─── helpers ─── */

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

/* ─── field-level suggestion banner ─── */

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

/* ─── preview card ─── */

function ShopPreview({ form }: { form: ConfirmForm }) {
  return (
    <div className="rounded-2xl border border-border bg-foreground/[0.02] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
        Preview
      </p>
      <p className="mt-2 text-lg font-semibold">{form.name || "—"}</p>
      {form.description ? (
        <p className="mt-1 text-sm text-muted">{form.description}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted">
        {form.shop_type ? (
          <span className="rounded-full border border-border px-2 py-0.5 capitalize">
            {form.shop_type}
          </span>
        ) : null}
        {form.category ? (
          <span className="rounded-full border border-border px-2 py-0.5">
            {form.category}
          </span>
        ) : null}
        {form.locationDisplay ? (
          <span className="rounded-full border border-border px-2 py-0.5">
            📍 {form.locationDisplay}
          </span>
        ) : null}
        {form.availability ? (
          <span className="rounded-full border border-border px-2 py-0.5">
            🕐 {form.availability}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ─── main component ─── */

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

  // When AI returns a suggestion we show the review/edit form.
  const [suggestedShop, setSuggestedShop] = useState<SuggestedShop | null>(null);
  const [confirmForm, setConfirmForm] = useState<ConfirmForm | null>(null);
  // Track which AI-suggested fields haven't been accepted/dismissed yet
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !input.trim()) return;
    const text = input.trim();
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
        // Mark all non-empty AI-supplied fields as pending-suggestion so the
        // user gets a banner to accept or dismiss each one.
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
        location: confirmForm.locationDisplay.trim()
          ? { display: confirmForm.locationDisplay.trim() }
          : undefined,
        availability: confirmForm.availability.trim()
          ? { hours: confirmForm.availability.trim() }
          : undefined,
        shop_type: confirmForm.shop_type as apiShops.ShopType,
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
    // User wants to edit — just clear the value so they type their own
    setConfirmForm((f) => (f ? { ...f, [field]: "" } : f));
    setPendingSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }

  function field(key: keyof ConfirmForm, value: string) {
    setConfirmForm((f) => (f ? { ...f, [key]: value } : f));
    // Once the user types, the suggestion is resolved
    setPendingSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  /* ── startup ── */
  if (!sessionId && !error) {
    return (
      <p className="text-sm text-muted">Starting AI shop assistant…</p>
    );
  }
  if (error && !sessionId) {
    return (
      <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
        {error}
      </p>
    );
  }

  /* ── review & create form ── */
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
          {/* Name + slug */}
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

            {/* Description with AI suggestion */}
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

            {/* About with AI suggestion */}
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

            {/* Type + Category */}
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

            <div className="space-y-1.5">
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
                <input
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm dm-focus"
                  value={f.category}
                  onChange={(e) => field("category", e.target.value)}
                  placeholder="e.g. Food & Beverage, Fashion…"
                />
              )}
            </div>

            {/* Logo */}
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

            {/* Contact */}
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
              <input
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm dm-focus"
                value={f.whatsappNumber}
                onChange={(e) => field("whatsappNumber", e.target.value)}
                placeholder="+256700000000"
              />
            </div>

            {/* Location + hours */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Location
              </label>
              <input
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm dm-focus"
                value={f.locationDisplay}
                onChange={(e) => field("locationDisplay", e.target.value)}
                placeholder="e.g. Kampala, Uganda"
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
              className="dm-pill dm-focus bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {creating ? "Creating your shop…" : "Create shop"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSuggestedShop(null);
                setConfirmForm(null);
              }}
              className="dm-pill dm-focus border border-border px-4 py-2.5 text-sm font-semibold hover:bg-foreground/[0.04]"
            >
              Keep chatting
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ── chat ── */
  return (
    <div className="space-y-3">
      <div className="max-h-[320px] min-h-[200px] space-y-2 overflow-y-auto rounded-2xl border border-border bg-background/60 px-3 py-2">
        {messages.length === 0 ? (
          <p className="text-xs text-muted">
            Tell the assistant what kind of shop you want to open — name, what
            you sell, location. The more detail, the better.
          </p>
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
                  "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed " +
                  (m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground/[0.05] text-foreground/90")
                }
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : null}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="h-9 flex-1 rounded-2xl border border-border bg-background px-3 text-sm dm-focus"
          placeholder="e.g. I run a bakery in Kampala selling cakes and pastries…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-9 px-4 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold dm-focus disabled:opacity-60"
        >
          {loading ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
