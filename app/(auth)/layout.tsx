import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Link href="/" className="inline-flex items-center gap-2 mb-8">
        <Image
          src="/logo.png"
          alt="Midora Online"
          width={52}
          height={52}
          className="rounded-xl"
          priority
        />
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight">Midora Online</p>
          <p className="text-xs text-muted">Brand-first discovery</p>
        </div>
      </Link>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

