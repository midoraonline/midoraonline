import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col items-center justify-center px-4 py-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
      <Link
        href="/"
        className="mb-8 inline-block text-center sm:mb-10"
      >
        <Image
          src="/logo.png"
          alt="Midora Online"
          width={200}
          height={68}
          className="h-10 w-auto sm:h-12"
          priority
        />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

