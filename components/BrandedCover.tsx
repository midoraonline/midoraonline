import Image from "next/image";
import type { ReactNode } from "react";

export const BRAND_PITCH =
  "Whether you're selling a single item or growing a full brand, discover products, services, and opportunities through a smart feed built to be seen—backed by proper analytics to help you build.";

/** Themed Midora panel that fills the space on listings without a photo. */
export default function BrandedCover({
  className = "",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2.5 rounded-xl border border-border/60 bg-gradient-to-br from-surface-subtle via-surface to-accent/15 p-3 text-center sm:p-4 ${className}`}
    >
      <Image src="/lightlogo.png" alt="Midora" width={1161} height={419} className="h-auto w-20 dark:hidden sm:w-24" />
      <Image src="/darklogo.png" alt="Midora" width={1161} height={419} className="hidden h-auto w-20 dark:block sm:w-24" />
      <p className="flex-1 text-xs font-semibold leading-relaxed text-foreground sm:text-[13px]">
        {BRAND_PITCH}
      </p>
      {children ? <div className="w-full">{children}</div> : null}
    </div>
  );
}
