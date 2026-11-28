import Image from "next/image";

export default function AboutUs() {
  return (
    <>
      {/* Hero banner — sits at dm-container root level for true full-bleed */}
      <div className="relative -mx-4 -mt-6 h-44 overflow-hidden sm:-mx-6 sm:-mt-8 sm:h-56 lg:-mx-8 lg:-mt-10 lg:h-64 xl:-mx-12">
        <Image src="/about_banner.png" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" />
        <div className="relative z-10 flex h-full flex-col justify-center dm-container">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Our story</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            About Midora Online
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/75">
            A marketplace built in Uganda to help African businesses sell online.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 pt-8 sm:space-y-10 sm:pt-10">
        <section className="dm-card p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-semibold text-muted">About</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Shops come first on Midora Online.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Midora Online helps sellers open a professional online shop for a
            low monthly fee. Every listing links back to the shop behind it, so
            buyers always know who they&apos;re dealing with.
          </p>
        </section>

        <section className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          <div className="dm-card p-6 sm:p-7">
            <h2 className="text-base font-semibold tracking-tight">For sellers</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Open a shop in minutes and add your listings. Our AI can suggest a
              title, description and tags from a single photo.
            </p>
          </div>
          <div className="dm-card p-6 sm:p-7">
            <h2 className="text-base font-semibold tracking-tight">For buyers</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Follow shops you like, find new shops through their listings, and
              go back to any shop whenever you want.
            </p>
          </div>
        </section>

        <section className="dm-card p-6 sm:p-8 lg:p-10">
          <h2 className="text-base font-semibold tracking-tight">Our principle</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            A marketplace shouldn&apos;t hide the people behind it. Shop badges,
            shop pages and how we show listings all help buyers get to know the
            seller, not just the item.
          </p>
        </section>
      </div>
    </>
  );
}
