import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] min-h-screen">
      {/* Left Column — Form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-5 sm:px-6 lg:w-1/2 lg:px-8 xl:px-10">
        <Link
          href="/"
          className="mb-5 self-center sm:mb-6"
        >
          <Image
            src="/logo.png"
            alt="Midora Online"
            width={160}
            height={54}
            className="h-8 w-auto sm:h-10"
            priority
          />
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>

      {/* Right Column — Decorative Panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0">
          <Image
            src="/logo.png"
            alt=""
            fill
            className="object-cover object-center opacity-10"
            priority
            aria-hidden
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />

        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="max-w-md">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <Image
                src="/logo.png"
                alt=""
                width={48}
                height={48}
                className="h-10 w-auto brightness-0 invert"
              />
            </div>
            <h2 className="mb-3 font-display text-3xl font-bold tracking-tight text-white">
              Welcome to Midora Online
            </h2>
            <p className="text-base leading-relaxed text-white/70">
              Your premier marketplace connecting merchants and customers.
              Discover unique products, shop with confidence, and grow your business.
            </p>
          </div>

          {/* Bottom decorative bar */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <div className="h-px w-12 bg-white/20" />
              <span>Midora Online</span>
              <div className="h-px w-12 bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
