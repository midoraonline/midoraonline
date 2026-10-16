"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import FormModal from "@/components/FormModal";
import { ApiError } from "@/lib/api/base";
import AdminBoostStatus from "@/components/admin/AdminBoostStatus";
import { refreshAfterRankChange } from "@/lib/api/listingActions";
import {
  ADMIN_BOOST_PACKAGES_KEY,
  adminEndBoosts,
  adminGrantBoost,
  listBoostPackages,
  type BoostTarget,
} from "@/lib/api/adminPlans";
import { BTN_PRIMARY, BTN_SECONDARY, BTN_TEXT, INPUT } from "@/components/dashboard/ui";

const CUSTOM = "custom";

function message(err: unknown) {
  if (err instanceof ApiError) return err.status === 503 ? "Run migration 059 first." : err.message;
  return "Something went wrong.";
}

/** Admin-only free boost for a listing or a whole business (all its live listings). */
export default function AdminBoostButton({
  target,
  id,
  name,
  className,
}: {
  target: BoostTarget;
  id: string;
  name?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? BTN_SECONDARY}>
        <Rocket className="size-4" aria-hidden /> Boost
      </button>
      {open ? <BoostDialog target={target} id={id} name={name} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function BoostDialog({
  target,
  id,
  name,
  onClose,
}: {
  target: BoostTarget;
  id: string;
  name?: string | null;
  onClose: () => void;
}) {
  const { data: packages, isLoading } = useSWR(ADMIN_BOOST_PACKAGES_KEY, listBoostPackages);
  const [choice, setChoice] = useState<string>("");
  const [hours, setHours] = useState("24");
  const [score, setScore] = useState("50");
  const [busy, setBusy] = useState<"grant" | "end" | null>(null);

  const selected = choice || packages?.find((p) => p.is_active)?.id || CUSTOM;
  const custom = selected === CUSTOM;
  const h = Number(hours);
  const s = Number(score);
  const valid = !custom || (Number.isInteger(h) && h >= 1 && h <= 2160 && Number.isInteger(s) && s >= 0 && s <= 500);
  const what = target === "shop" ? "business" : "listing";

  async function grant() {
    if (!valid) return;
    setBusy("grant");
    try {
      const out = await adminGrantBoost(
        target,
        id,
        custom ? { hours: h, score_bonus: s } : { package_id: selected },
      );
      toast.success(target === "shop" ? `Boosted ${out.boosted} live listings` : "Listing boosted");
      refreshAfterRankChange();
      onClose();
    } catch (err) {
      toast.error(message(err));
    } finally {
      setBusy(null);
    }
  }

  async function end() {
    setBusy("end");
    try {
      const out = await adminEndBoosts(target, id);
      toast.success(out.ended ? `Ended ${out.ended} boost${out.ended === 1 ? "" : "s"}` : "Nothing was boosted");
      refreshAfterRankChange();
      onClose();
    } catch (err) {
      toast.error(message(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <FormModal
      title={`Boost ${what}${name ? `: ${name}` : ""}`}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => void end()} disabled={busy !== null} className={BTN_TEXT}>
            {busy === "end" ? "Ending…" : target === "shop" ? "End business boost" : "End boost"}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={BTN_SECONDARY}>
              Cancel
            </button>
            <button type="button" onClick={() => void grant()} disabled={!valid || busy !== null} className={BTN_PRIMARY}>
              {busy === "grant" ? "Boosting…" : "Boost free"}
            </button>
          </div>
        </div>
      }
    >
      <p className="text-sm text-muted">
        Admin test boost: no payment and no plan allowance used. Replaces any current boost.
        {target === "shop" ? " Applies to every live listing of this business right now." : ""}
      </p>
      <AdminBoostStatus
        listingId={target === "listing" ? id : undefined}
        shopId={target === "shop" ? id : undefined}
        className="mt-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2"
      />
      <fieldset className="mt-4 space-y-2">
        <legend className="text-xs font-semibold text-foreground-muted">Package</legend>
        {isLoading && !packages ? (
          <div className="space-y-2" aria-busy="true">
            <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
            <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
          </div>
        ) : null}
        {(packages ?? []).map((p) => (
          <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
            <input type="radio" name="pkg" checked={selected === p.id} onChange={() => setChoice(p.id)} />
            <span className="flex-1 text-foreground">
              {p.name}
              {!p.is_active ? <span className="text-muted"> (inactive)</span> : null}
            </span>
            <span className="text-xs text-muted">
              {p.duration_hours}h · +{p.score_bonus}
            </span>
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
          <input type="radio" name="pkg" checked={custom} onChange={() => setChoice(CUSTOM)} />
          <span className="text-foreground">Custom</span>
        </label>
      </fieldset>
      {custom ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-foreground-muted">
            Hours (1–2160)
            <input type="number" inputMode="numeric" min={1} max={2160} value={hours}
              onChange={(e) => setHours(e.target.value)} className={`${INPUT} mt-1`} />
          </label>
          <label className="text-xs font-medium text-foreground-muted">
            Score weight (0–500)
            <input type="number" inputMode="numeric" min={0} max={500} value={score}
              onChange={(e) => setScore(e.target.value)} className={`${INPUT} mt-1`} />
          </label>
        </div>
      ) : null}
      {!valid ? <p className="mt-2 text-xs text-[color:var(--error)]">Hours 1–2160, score 0–500.</p> : null}
    </FormModal>
  );
}
