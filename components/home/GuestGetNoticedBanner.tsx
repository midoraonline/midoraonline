import Link from "next/link";
import { PiArrowRightBold, PiStorefrontFill } from "react-icons/pi";
import { BRAND_TAGLINE } from "@/lib/brand";

export default function GuestGetNoticedBanner() {
  return (
    <aside
      aria-label={BRAND_TAGLINE}
      className="mb-2.5 flex items-center justify-between gap-2 rounded-full bg-accent/[0.06] py-1 pl-3 pr-1 ring-1 ring-accent/20 sm:mb-3"
    >
      <p className="min-w-0 truncate font-display text-xs font-bold tracking-tight text-accent sm:text-[13px]">
        {BRAND_TAGLINE}
      </p>
      <Link
        href="/open-shop"
        className="dm-focus group inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-accent pl-1 pr-2.5 text-[11px] font-semibold text-white shadow-sm shadow-accent/30 transition-all hover:bg-accent-hover hover:shadow-md active:scale-95"
      >
        <span className="grid size-5 place-items-center rounded-full bg-white/20">
          <PiStorefrontFill className="size-3" aria-hidden />
        </span>
        Open your shop
        <PiArrowRightBold className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </aside>
  );
}
