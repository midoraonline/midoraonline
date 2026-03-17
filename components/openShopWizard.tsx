"use client";

import { useState } from "react";
import { apiShops, apiAiContext } from "@/lib/api";

type Step = 1 | 2 | 3;

export default function OpenShopWizard() {
  const [step, setStep] = useState<Step>(1);
  const [creating, setCreating] = useState(false);
  const [creatingContext, setCreatingContext] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [shopType, setShopType] = useState<apiShops.ShopType>("online");

  const [aiBrief, setAiBrief] = useState(
    "We sell modern, trustworthy products. Answer in a friendly, concise tone and always mention our shop name when helpful."
  );

  const [createdShop, setCreatedShop] =
    useState<apiShops.Shop | null>(null);

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

    setError(null);
    setCreating(true);

    try {
      const shop = await apiShops.createShop(token, {
        name: name.trim(),
        category: category.trim() || undefined,
        location: location.trim() || undefined,
        shop_type: shopType,
      });
      setCreatedShop(shop);
      setStep(2);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create your shop. Please try again."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateContext(e: React.FormEvent) {
    e.preventDefault();
    if (!createdShop) return;
    const token = getToken();
    if (!token) {
      setError("Please log in again to continue.");
      return;
    }
    if (!aiBrief.trim()) {
      setError("Please add a short brief for the AI.");
      return;
    }

    setError(null);
    setCreatingContext(true);

    try {
      await apiAiContext.createAiContext(token, createdShop.id, {
        key: "shop_brief",
        value: aiBrief.trim(),
      });
      setStep(3);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save the AI brief. Please try again."
      );
    } finally {
      setCreatingContext(false);
    }
  }

  return (
    <div className="dm-card p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Open a Shop
          </h2>
          <p className="mt-1 text-sm text-muted">
            Create your storefront, give the AI concierge a brief, and start
            welcoming customers.
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted">
          <span
            className={
              "inline-flex items-center rounded-full px-2 py-1 border text-[11px] " +
              (step === 1
                ? "border-foreground text-foreground"
                : "border-border")
            }
          >
            1 · Details
          </span>
          <span
            className={
              "inline-flex items-center rounded-full px-2 py-1 border text-[11px] " +
              (step === 2
                ? "border-foreground text-foreground"
                : "border-border")
            }
          >
            2 · AI concierge
          </span>
          <span
            className={
              "inline-flex items-center rounded-full px-2 py-1 border text-[11px] " +
              (step === 3
                ? "border-foreground text-foreground"
                : "border-border")
            }
          >
            3 · Finish
          </span>
        </div>
      </div>

      {error ? (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
          {error}
        </p>
      ) : null}

      {step === 1 && (
        <form onSubmit={handleCreateShop} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground/80">
                Shop name
              </label>
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="e.g. Nakasero Home Goods"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Category (optional)
              </label>
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="e.g. Home & living"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Location (optional)
              </label>
              <input
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                placeholder="e.g. Kampala, Uganda"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                Shop type
              </label>
              <select
                className="h-9 w-full rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
                value={shopType}
                onChange={(e) =>
                  setShopType(e.target.value as apiShops.ShopType)
                }
              >
                <option value="online">Online</option>
                <option value="downtown">Physical / downtown</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="dm-pill dm-focus bg-foreground text-background hover:opacity-95 transition-opacity px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {creating ? "Creating shop…" : "Create shop"}
            </button>
          </div>
        </form>
      )}

      {step === 2 && createdShop && (
        <form onSubmit={handleCreateContext} className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold tracking-tight">
              Teach the AI concierge about your shop
            </p>
            <p className="text-xs text-muted max-w-xl">
              This brief is stored as AI context for{" "}
              <span className="font-semibold">{createdShop.name}</span>. The
              in-shop concierge will use it to answer questions about your
              brand, tone, and policies.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80">
              AI brief
            </label>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs dm-focus"
              value={aiBrief}
              onChange={(e) => setAiBrief(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-muted hover:text-foreground dm-focus rounded-full px-3 py-1.5"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={creatingContext}
              className="dm-pill dm-focus bg-foreground text-background hover:opacity-95 transition-opacity px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {creatingContext ? "Saving brief…" : "Save AI brief"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && createdShop && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold tracking-tight">
              You&apos;re ready to go
            </p>
            <p className="text-xs text-muted max-w-xl">
              Your shop is created and the AI concierge has a first brief.
              Next, you can add products and share your link.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={`/shops/${encodeURIComponent(createdShop.slug)}`}
              className="dm-pill dm-focus bg-foreground text-background hover:opacity-95 transition-opacity px-4 py-2.5 text-sm text-center font-semibold"
            >
              View my shop
            </a>
            <a
              href={`/chat?shop_id=${encodeURIComponent(createdShop.id)}`}
              className="dm-pill dm-focus border border-border bg-surface text-foreground/85 hover:bg-foreground/5 transition-colors px-4 py-2.5 text-sm text-center font-semibold"
            >
              Chat with concierge
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

