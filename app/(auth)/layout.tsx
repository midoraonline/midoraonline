import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col items-center justify-center px-4 py-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
      <Link
        href="/"
        className="mb-8 flex flex-col items-center gap-3 text-center sm:mb-10"
      >
        <Image
          src="/logo.png"
          alt="Midora Online"
          width={56}
          height={56}
          className="rounded-xl sm:h-[60px] sm:w-[60px]"
          priority
        />
        <p className="text-base font-semibold tracking-tight sm:text-lg">Midora Online</p>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

