"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { StepProgress, INPUT, TEXTAREA, FormError } from "@/components/post/StepFrame";
import { BTN_PRIMARY, BTN_TEXT } from "@/components/dashboard/ui";
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

const STARTER_PROMPTS = [
  "I bake cakes in Kampala and deliver",
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
    <div className="rounded-md border border-border px-3 py-2.5">
      <p className="text-xs text-muted">Suggested {label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onAccept} className="text-sm font-medium text-foreground underline underline-offset-2">
          Use this
        </button>
        <button type="button" onClick={onEdit} className="text-sm text-muted hover:text-foreground">
          Write my own
        </button>
      </div>
    </div>
  );
}

function ShopPreview({ form }: { form: ConfirmForm }) {
  const meta = [form.category, form.locationDisplay].filter(Boolean).join(" · ");
  return (
    <div className="rounded-md border border-border px-4 py-3">
      <p className="text-xs text-muted">Preview</p>
      <p className="mt-1 text-base font-semibold text-foreground">{form.name || "Your shop name"}</p>
      {form.description ? <p className="mt-0.5 text-sm text-muted">{form.description}</p> : null}
      {meta ? <p className="mt-1 text-xs text-muted">{meta}</p> : null}
    </div>
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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      notifyAuthChanged();
      onShopCreated(shop);
    } catch (err) {
      setError(isMaintenanceMode(err) ? MAINTENANCE_MESSAGE : err instanceof Error ? err.message : "Could not create shop.");
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
          <p className="text-base font-semibold text-foreground">Check your shop details</p>
          <p className="mt-1 text-sm text-muted">We filled in what we could. Change anything that isn&apos;t right.</p>
        </div>

        <ShopPreview form={f} />

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-4">
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
                Business phone number <span className="font-normal text-muted">(optional)</span>
              </label>
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

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-t border-border bg-background px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:p-0">
            <button
              type="submit"
              disabled={creating}
              className={BTN_PRIMARY}
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
              className={BTN_TEXT}
            >
              Back to chat
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <StepProgress step={1} total={2} />
        <p className="text-base font-semibold text-foreground">Tell us about your business</p>
        <p className="mt-1 text-sm text-muted">
          What you sell, where you are and anything special. English, Swahili or Luganda is fine.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted">Or start from an example</p>
          <div className="divide-y divide-border rounded-md border border-border">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading || !sessionId}
                onClick={() => void sendMessage(prompt)}
                className="block w-full px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-surface disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-h-[50dvh] space-y-3 overflow-y-auto rounded-md border border-border p-3">
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  "max-w-[85%] whitespace-pre-wrap break-words rounded-md px-3 py-2 text-sm " +
                  (m.role === "user" ? "bg-foreground text-background" : "bg-surface text-foreground")
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
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      {error ? <FormError>{error}</FormError> : null}

      <form onSubmit={handleSend} className="flex gap-2">
        <label htmlFor="concierge-input" className="sr-only">
          Describe your business
        </label>
        <input
          id="concierge-input"
          className={`${INPUT} min-w-0 flex-1`}
          placeholder="e.g. I sell second-hand phones in Ntinda"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Send" className={`${BTN_PRIMARY} w-10 shrink-0 px-0`}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        </button>
      </form>
    </div>
  );
}
