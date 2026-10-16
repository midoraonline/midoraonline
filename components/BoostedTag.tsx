import { Zap } from "lucide-react";

/** "Boosted" chip shown while a boost is active. Same shape as ListingTypeTag; accent tokens work in light and dark. */
export default function BoostedTag({ className = "", title }: { className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white ${className}`}
    >
      <Zap className="size-[1em]" strokeWidth={2.5} aria-hidden />
      Boosted
    </span>
  );
}
