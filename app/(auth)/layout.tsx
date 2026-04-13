import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-[100dvh] min-h-screen flex-col items-stretch justify-start px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center sm:justify-center sm:px-6 sm:pt-10 sm:pb-10"
    >
      <Link
        href="/"
        className="mb-6 inline-flex shrink-0 items-center gap-2.5 self-start sm:mb-8 sm:self-center"
      >
        <Image
          src="/logo.png"
          alt="Midora Online"
          width={48}
          height={48}
          className="rounded-xl sm:h-[52px] sm:w-[52px]"
          priority
        />
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight">Midora Online</p>
          <p className="text-xs text-muted">Brand-first discovery</p>
        </div>
      </Link>
      <div className="w-full max-w-md flex-1 sm:flex-none">{children}</div>
    </div>
  );
}

