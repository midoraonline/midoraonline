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
      className={`flex flex-col items-center gap-2.5 text-center sm:rounded-xl sm:border sm:border-border/60 sm:bg-gradient-to-br sm:from-surface-subtle sm:via-surface sm:to-accent/15 sm:p-4 ${className}`}
    >
      <div className="hidden w-full flex-1 flex-col items-center gap-2.5 sm:flex">
        <Image src="/lightlogo.png" alt="Midora" width={1161} height={419} className="h-auto w-24 dark:hidden" />
        <Image src="/darklogo.png" alt="Midora" width={1161} height={419} className="hidden h-auto w-24 dark:block" />
        <p className="flex-1 text-[13px] font-semibold leading-relaxed text-foreground">{BRAND_PITCH}</p>
      </div>
      {children ? <div className="w-full">{children}</div> : null}
    </div>
  );
}
