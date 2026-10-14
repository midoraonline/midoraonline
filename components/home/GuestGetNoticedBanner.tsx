import Link from "next/link";
import { Plus, Store } from "lucide-react";

export default function GuestGetNoticedBanner() {
  return (
    <aside
      aria-label="Get noticed"
      className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-accent/25 bg-accent/5 px-2.5 py-1.5 sm:mb-4"
    >
      <p className="min-w-0 truncate text-[11px] font-medium text-foreground sm:text-xs">
        Get noticed — post an ad for free
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link href="/post-item" className="dm-btn dm-btn-primary min-h-7 gap-1 px-2.5 py-1 text-[11px] whitespace-nowrap">
          <Plus className="size-3" aria-hidden />
          Post
        </Link>
        <Link href="/open-shop" className="dm-btn dm-btn-secondary min-h-7 gap-1 px-2.5 py-1 text-[11px] whitespace-nowrap">
          <Store className="size-3" aria-hidden />
          Open shop
        </Link>
      </div>
    </aside>
  );
}
