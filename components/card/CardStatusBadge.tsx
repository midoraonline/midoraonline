import { AlarmClock, Clock, Flame, Gem, type LucideIcon } from "lucide-react";
import type { CardStatus } from "@/lib/api/products";

type BadgeStyle = { label: string; icon: LucideIcon; tone: string };

/** One temporary badge per card. boosted/trending are seller-side signals, so buyers never see them. */
const STATUS_STYLE: Record<CardStatus, BadgeStyle | null> = {
  sponsored: { label: "Sponsored", icon: Gem, tone: "bg-slate-900 dark:bg-slate-700" },
  closes_today: { label: "Closes today", icon: AlarmClock, tone: "bg-red-600" },
  closing_soon: { label: "Closing soon", icon: Clock, tone: "bg-violet-600" },
  new: { label: "New", icon: Flame, tone: "bg-orange-500" },
  boosted: null,
  trending: null,
};

export function hasVisibleStatus(status: CardStatus | null | undefined): status is CardStatus {
  return !!status && !!STATUS_STYLE[status];
}

export default function CardStatusBadge({ status }: { status: CardStatus | null | undefined }) {
  const style = status ? STATUS_STYLE[status] : null;
  if (!style) return null;
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold leading-none text-white shadow-sm sm:text-[13px] ${style.tone}`}
    >
      <Icon className="size-[1.05em]" strokeWidth={2.5} aria-hidden />
      {style.label}
    </span>
  );
}
