"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Megaphone, Plus, Share2 } from "lucide-react";
import { apiFetch } from "@/lib/api/base";
import { areaLabel } from "@/lib/browseArea";
import { useAppSession } from "@/lib/state";

export function requestDemand(body: { need: string; category?: string | null; area?: string | null; notify: boolean }) {
  return apiFetch<{ ok: boolean; alerts: boolean }>("/api/v1/feed/demand", { method: "POST", body });
}

export function NeedForm({
  initialNeed = "",
  area,
  category,
}: {
  initialNeed?: string;
  area?: string | null;
  category?: string | null;
}) {
  const session = useAppSession();
  const [need, setNeed] = useState(initialNeed);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (need.trim().length < 3) return;
    setBusy(true);
    try {
      const res = await requestDemand({ need: need.trim(), category, area, notify: notify && session.isAuthenticated });
      setDone(true);
      toast.success(res.alerts ? "Saved. We'll tell you when a match is posted." : "Thanks. Sellers will see what buyers need.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className="text-sm text-muted">Got it. We use requests like yours to bring the right sellers to Midora.</p>;
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-2">
      <label htmlFor="need-input" className="block text-sm font-medium text-foreground">
        Tell Midora what you need{area && area !== "all" ? ` in ${areaLabel(area)}` : ""}
      </label>
      <div className="flex gap-2">
        <input
          id="need-input"
          value={need}
          maxLength={200}
          onChange={(e) => setNeed(e.target.value)}
          placeholder="e.g. Plumber, iPhone 13, house help"
          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
        />
        <button type="submit" disabled={busy || need.trim().length < 3} className="dm-btn dm-btn-primary dm-btn-sm">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Send"}
        </button>
      </div>
      {session.isAuthenticated ? (
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4" />
          Notify me when a matching listing is posted
        </label>
      ) : (
        <p className="text-xs text-muted">
          <Link href="/login?next=/" className="font-medium text-accent underline underline-offset-2">Sign in</Link> to get
          notified when it&apos;s listed.
        </p>
      )}
    </form>
  );
}

async function inviteSeller() {
  const url = `${window.location.origin}/open-shop`;
  const text = "Sell on Midora: list your products, services and opportunities for free.";
  try {
    if (navigator.share) {
      await navigator.share({ title: "Midora", text, url });
      return;
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied. Send it to a seller you trust.");
  } catch {
    /* ignore */
  }
}

/** Shown when Home has no listings: honest message plus ways to add supply and record demand. */
export default function DemandCapture({ area }: { area?: string | null }) {
  return (
    <section className="space-y-5 rounded-xl border border-dashed border-border p-5 sm:p-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">Listings are being added</h3>
        <p className="text-sm text-muted">
          Midora is new{area && area !== "all" ? ` in ${areaLabel(area)}` : ""}, so there&apos;s nothing to show yet. We
          won&apos;t fill this space with fake listings.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/post-item" className="dm-btn dm-btn-primary dm-btn-sm">
          <Plus className="size-4" aria-hidden />
          Be the first to list
        </Link>
        <button type="button" onClick={() => void inviteSeller()} className="dm-btn dm-btn-ghost dm-btn-sm">
          <Share2 className="size-4" aria-hidden />
          Invite a seller
        </button>
      </div>
      <div className="flex items-start gap-3">
        <Megaphone className="mt-1 size-5 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <NeedForm area={area} />
        </div>
      </div>
    </section>
  );
}
