"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { StepProgress, INPUT, TEXTAREA, FormError } from "@/components/post/StepFrame";
import { BTN_PRIMARY, BTN_PRIMARY_LG, BTN_SECONDARY, BTN_SECONDARY_LG } from "@/components/dashboard/ui";
import { apiChat, apiShops } from "@/lib/api";
import type { SuggestedShop } from "@/lib/api/chat";
import CategoryPicker from "@/components/CategoryPicker";
import { SingleImageField } from "@/components/upload/SingleImageField";
import LocationInput from "@/components/LocationInput";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { useAppSession } from "@/lib/state";
import { notifyAuthChanged } from "@/lib/auth/token-storage";
import ShopHoursEditor from "@/components/shop/ShopHoursEditor";
import { buildShopLocationPayload } from "@/components/shop/shopUtils";
import { hoursAreBlank, hoursDraftError, hoursDraftFromShop, shopHoursWritePayload, type HoursDraft } from "@/lib/shopHours";
import type { LatLng } from "@/lib/geo";
import { isMaintenanceMode, MAINTENANCE_MESSAGE } from "@/lib/platformMessages";
import { checkShopWhatsAppQuietly } from "@/lib/shopWhatsapp";

const STARTER_PROMPTS = [
  "I bake cakes in Kampala and deliver by boda",
  "Phone accessories and repairs in Ntinda, UGX 10,000 to 300,000",
  "Cleaning and laundry services across Wakiso for homes and offices",
  "Salon in Mukono that also hires stylists and trainees",
  "Rentals and land plots around Entebbe Road",
] as const;

const CARD = "rounded-xl border border-border bg-surface p-4 shadow-xs sm:p-6";

type ChatLine = { id: string; role: "user" | "assistant"; content: string };

/** Older API replies (and history) may still carry the JSON block. */
function visibleReply(text: string, hasDraft: boolean): string {
  const cleaned = text
    .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, "")
    .replace(/```(?:json)?\s*\{[\s\S]*$/, "")
    .trim();
  if (cleaned) return cleaned;
  return hasDraft ? "I've drafted your business. Check the details and change anything that isn't right." : text.trim();
}

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
  hours: HoursDraft;
  shop_type: string;
};

type TextField = Exclude<keyof ConfirmForm, "hours">;

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
    hours: hoursDraftFromShop({
      availability: s.availability ? { hours: s.availability } : null,
    }),
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
    <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
        <Sparkles className="size-3.5" aria-hidden />
        Suggested {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onAccept} className={BTN_PRIMARY}>
          Use this
        </button>
        <button type="button" onClick={onEdit} className={BTN_SECONDARY}>
          Write my own
        </button>
      </div>
    </div>
  );
}

function ShopPreview({ form }: { form: ConfirmForm }) {
  const meta = [form.category, form.locationDisplay].filter(Boolean).join(" · ");
  return (
    <div className={CARD}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Preview</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{form.name || "Your business name"}</p>
      {form.description ? <p className="mt-0.5 text-sm text-muted">{form.description}</p> : null}
      {meta ? <p className="mt-1 text-xs text-muted">{meta}</p> : null}
    </div>
  );
}

function ShopInsights({ shop, onAddToAbout }: { shop: SuggestedShop; onAddToAbout: (text: string) => void }) {
  const facts = [
    { label: "Customers", value: shop.target_customers },
    { label: "Areas served", value: shop.service_areas },
    { label: "Price range", value: shop.price_range },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value?.trim()));
  const ideas = shop.listing_ideas ?? [];
  const tips = shop.tips ?? [];
  if (!facts.length && !ideas.length && !tips.length) return null;
  return (
    <section className={`${CARD} space-y-4`} aria-labelledby="shop-insights-heading">
      <h2 id="shop-insights-heading" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Sparkles className="size-4 text-accent" aria-hidden />
        What we picked up
      </h2>
      {facts.length ? (
        <dl className="grid gap-3 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{f.label}</dt>
              <dd className="mt-0.5 text-sm text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {shop.target_customers || shop.service_areas ? (
        <button
          type="button"
          className={BTN_SECONDARY}
          onClick={() =>
            onAddToAbout(
              [
                shop.target_customers ? `We serve ${shop.target_customers.replace(/\.$/, "")}.` : "",
                shop.service_areas ? `We cover ${shop.service_areas.replace(/\.$/, "")}.` : "",
              ]
                .filter(Boolean)
                .join(" "),
            )
          }
        >
          Add these to About
        </button>
      ) : null}
      {ideas.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">First listings to post</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {ideas.map((idea) => (
              <li key={idea} className="rounded-full border border-border bg-surface-subtle px-3 py-1 text-sm text-foreground">
                {idea}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {tips.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tips for this shop</p>
          <ul className="mt-2 space-y-1.5">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default function CreateShopConcierge({
  onShopCreated,
  verifiedContacts,
  enabled,
}: {
  onShopCreated: (shop: apiShops.Shop) => void;
  verifiedContacts: { email: string | null; phone: string | null };
  enabled: boolean;
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
    Set<TextField>
  >(new Set());

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  useEffect(() => {
    if (!enabled || !appSession.hydrated) return;
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
  }, [enabled, appSession.hydrated, appSession.isAuthenticated]);

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
      const reply = visibleReply(res.message ?? "", Boolean(res.suggested_shop));
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
        form.shopEmail = verifiedContacts.email ?? form.shopEmail;
        form.whatsappNumber = verifiedContacts.phone ?? form.whatsappNumber;
        setConfirmForm(form);
        setLocationCoords(null);
        const suggested: Set<TextField> = new Set();
        (
          [
            "description",
            "about",
            "category",
            "availability",
          ] as (TextField)[]
        ).forEach((key) => {
          if (form[key]?.toString().trim()) suggested.add(key);
        });
        setPendingSuggestions(suggested);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        /timed out|timeout/i.test(msg)
          ? "The assistant took too long to reply. Send your message again."
          : /503|busy|rate/i.test(msg)
            ? "The assistant is busy right now. Try again in a moment."
            : msg || "Something went wrong.",
      );
      setMessages((prev) => prev.filter((m) => m.id !== pendingId));
      setInput(text);
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
    const hoursError = hoursDraftError(confirmForm.hours);
    if (hoursError) {
      setError(hoursError);
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
        ...(hoursAreBlank(confirmForm.hours) ? {} : shopHoursWritePayload(confirmForm.hours)),
        shop_type: confirmForm.shop_type as apiShops.ShopType,
        category: confirmForm.category.trim() || undefined,
        contacts: [],
        social_links: [],
      });
      checkShopWhatsAppQuietly(shop.id, Boolean(shop.whatsapp_number));
      notifyAuthChanged();
      onShopCreated(shop);
    } catch (err) {
      setError(isMaintenanceMode(err) ? MAINTENANCE_MESSAGE : err instanceof Error ? err.message : "Could not create your business.");
    } finally {
      setCreating(false);
    }
  }

  function acceptSuggestion(field: TextField) {
    setPendingSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }

  function dismissSuggestion(field: TextField) {
    setConfirmForm((f) => (f ? { ...f, [field]: "" } : f));
    setPendingSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }

  function field(key: TextField, value: string) {
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
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Starting the assistant…
      </div>
    );
  }
  if (error && !sessionId) {
    return (
<FormError>{error}</FormError>
    );
  }

  if (suggestedShop && confirmForm) {
    const f = confirmForm;
    return (
      <div className="space-y-5">
        <div>
          <StepProgress step={2} total={2} />
          <p className="text-base font-semibold text-foreground">Check your business details</p>
          <p className="mt-1 text-sm text-muted">We filled in what we could. Change anything that isn&apos;t right.</p>
        </div>

        <ShopPreview form={f} />
        <ShopInsights
          shop={suggestedShop}
          onAddToAbout={(text) => {
            const about = f.about.trim();
            field("about", about.includes(text) ? about : [about, text].filter(Boolean).join(" "));
          }}
        />

        <form onSubmit={handleCreate} className="space-y-5">
          <div className={`${CARD} space-y-4`}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Shop name
              </label>
              <input
                className={INPUT}
                value={f.name}
                onChange={(e) => field("name", e.target.value)}
                placeholder="e.g. Kampala Bakes"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Shop link
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted">/shops/</span>
                <input
                  className={`${INPUT} flex-1`}
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

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Short description <span className="font-normal text-muted">(optional)</span>
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
                  className={INPUT}
                  value={f.description}
                  onChange={(e) => field("description", e.target.value)}
                  placeholder="One line that describes your shop"
                  maxLength={160}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                About your shop <span className="font-normal text-muted">(optional)</span>
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
                  className={TEXTAREA}
                  value={f.about}
                  onChange={(e) => field("about", e.target.value)}
                  placeholder="What you sell, and how you deliver"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                What you sell
              </label>
              <select
                className={INPUT}
                value={f.shop_type}
                onChange={(e) => field("shop_type", e.target.value)}
              >
                <option value="product">Products</option>
                <option value="service">Services</option>
                <option value="both">Products and services</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
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
                <div>
                  <CategoryPicker
                    value={f.category}
                    onChange={(v) => field("category", v)}
                    compact
                    idPrefix="shop-category"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Logo
              </label>
              <SingleImageField
                endpoint="shopLogo"
                value={f.logoUrl}
                onChange={(url) => field("logoUrl", url ?? "")}
                emptyLabel="Add logo"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Business email <span className="font-normal text-muted">(optional)</span>
              </label>
              {verifiedContacts.email && f.shopEmail === verifiedContacts.email ? (
                <p className="text-xs text-muted">From your verified account. Change it if customers should use another.</p>
              ) : null}
              <input
                type="email"
                className={INPUT}
                value={f.shopEmail}
                onChange={(e) => field("shopEmail", e.target.value)}
                placeholder="hello@yourshop.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                WhatsApp number <span className="font-normal text-muted">(optional)</span>
              </label>
              {verifiedContacts.phone && f.whatsappNumber === verifiedContacts.phone ? (
                <p className="text-xs text-muted">From your verified phone. Buyers contact you here.</p>
              ) : null}
              <PhoneNumberInput
                value={f.whatsappNumber}
                onChange={(val) => field("whatsappNumber", val)}
                placeholder="700 000 000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Opening hours
              </label>
              {pendingSuggestions.has("availability") && f.availability.trim() ? (
                <AISuggestion
                  label="availability"
                  value={f.availability}
                  onAccept={() => acceptSuggestion("availability")}
                  onEdit={() => dismissSuggestion("availability")}
                />
              ) : null}
              <ShopHoursEditor
                value={f.hours}
                onChange={(hours) => setConfirmForm((current) => (current ? { ...current, hours } : current))}
              />
            </div>
          </div>

          {error ? <FormError>{error}</FormError> : null}

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-border bg-background px-4 py-3 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:p-0 sm:[&>*:first-child]:order-last [&>*]:w-full sm:[&>*]:w-auto sm:[&>*]:min-w-44">
            <button
              type="submit"
              disabled={creating}
              className={BTN_PRIMARY_LG}
            >
              {creating ? "Creating your business…" : "Create business"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSuggestedShop(null);
                setConfirmForm(null);
                setLocationCoords(null);
              }}
              className={BTN_SECONDARY_LG}
            >
              Back to chat
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[26rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs sm:h-[min(72dvh,680px)]">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-white" aria-hidden>
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Midora shop assistant</p>
          <p className="truncate text-xs text-muted">
            {loading ? "Typing…" : sessionId ? "Online · drafts your business in a few messages" : "Connecting…"}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-surface-subtle/50 px-3 py-4 sm:px-4" aria-live="polite">
        <AssistantBubble>
          Hi! Tell me about your business: what you offer, who buys, where you work and your price range in UGX.
          English, Swahili or Luganda is fine. Your verified email and phone are reused.
        </AssistantBubble>

        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2 pl-10">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading || !sessionId}
                onClick={() => void sendMessage(prompt)}
                className="dm-focus rounded-full border border-accent/40 bg-surface px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:border-accent hover:bg-accent/5 disabled:opacity-50 sm:text-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 text-sm text-white">
                {m.content}
              </div>
            </div>
          ) : (
            <AssistantBubble key={m.id}>
              {m.content === "Thinking…" ? (
                <span className="inline-flex items-center gap-1 py-1" aria-label="Assistant is typing">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted" />
                </span>
              ) : (
                m.content
              )}
            </AssistantBubble>
          ),
        )}
        <div ref={chatEndRef} />
      </div>

      {error ? (
        <div className="shrink-0 border-t border-border px-4 py-2">
          <FormError>{error}</FormError>
        </div>
      ) : null}

      <form
        onSubmit={handleSend}
        className="flex shrink-0 items-center gap-2 border-t border-border bg-surface px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
      >
        <label htmlFor="concierge-input" className="sr-only">
          Describe your business
        </label>
        <input
          id="concierge-input"
          className="h-11 min-w-0 flex-1 rounded-full border border-border-input bg-surface-subtle px-4 text-sm text-foreground outline-none placeholder:text-muted/80 focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/20"
          placeholder="Message the assistant…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || !sessionId}
          enterKeyHint="send"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !sessionId || !input.trim()}
          aria-label="Send"
          className="dm-focus grid size-11 shrink-0 place-items-center rounded-full border-2 border-accent bg-accent text-white transition-colors hover:border-accent-hover hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        </button>
      </form>
    </div>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/10 text-accent" aria-hidden>
        <Sparkles className="size-3.5" />
      </span>
      <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground shadow-xs">
        {children}
      </div>
    </div>
  );
}
