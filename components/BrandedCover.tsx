import Image from "next/image";

export const BRAND_PITCH =
  "Whether you're selling a single item or growing a full brand, discover products, services, and opportunities through a smart feed built to be seen—backed by proper analytics to help you build.";

/** Themed Midora panel used where a listing has no photo. */
export default function BrandedCover({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-br from-surface-subtle via-surface to-accent/10 p-3 text-center sm:gap-3 sm:p-4 ${className}`}
    >
      <Image src="/lightlogo.png" alt="Midora" width={1161} height={419} className="h-auto w-20 dark:hidden sm:w-24" />
      <Image src="/darklogo.png" alt="Midora" width={1161} height={419} className="hidden h-auto w-20 dark:block sm:w-24" />
      <p className="line-clamp-6 text-[10px] font-medium leading-snug text-foreground/70 sm:text-[11px]">
        {BRAND_PITCH}
      </p>
    </div>
  );
}
