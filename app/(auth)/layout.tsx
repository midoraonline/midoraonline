import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

const HERO_IMAGE = "/hero_lady_market.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] min-h-screen">
      {/* Left — form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-5 sm:px-6 lg:w-1/2 lg:px-8 xl:px-10">
        <Link href="/" className="mb-5 self-center sm:mb-6">
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

      {/* Right — hero image (same as home) */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          className="object-cover object-center"
          priority
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/25" />

        <div className="relative z-10 flex h-full flex-col justify-center p-12 xl:p-16">
          <div className="max-w-md space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              Midora Online
            </p>
            <h2 className="font-display text-3xl font-black leading-tight tracking-tight text-white xl:text-4xl">
              Find what you need near you —{" "}
              <span className="text-orange-500">fast.</span>
            </h2>
            <p className="text-sm leading-relaxed text-neutral-300">
              Real sellers. Clear prices. Shop local, support your community, and grow your business on Uganda&apos;s marketplace.
            </p>
          </div>

          <div className="absolute bottom-8 left-12 right-12 xl:left-16 xl:right-16">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <div className="h-px flex-1 bg-white/20" />
              <span>Kampala, Uganda</span>
              <div className="h-px flex-1 bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
