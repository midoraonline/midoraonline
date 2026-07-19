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
            Empowering African entrepreneurs with a modern digital marketplace.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 pt-8 sm:space-y-10 sm:pt-10">
        <section className="dm-card p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-semibold text-muted">About</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Midora Online is brand-first commerce.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Midora Online modernizes African commerce by helping merchants rent a
            professional digital space for an affordable monthly fee. Shops are
            the primary entity—products always point back to the brand behind
            them.
          </p>
        </section>

        <section className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          <div className="dm-card p-6 sm:p-7">
            <h2 className="text-base font-semibold tracking-tight">For merchants</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Spin up a storefront quickly, upload products, and use AI to generate
              titles, descriptions, and tags from a single photo.
            </p>
          </div>
          <div className="dm-card p-6 sm:p-7">
            <h2 className="text-base font-semibold tracking-tight">For shoppers</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Follow shops you love, discover new brands through products, and
              return to the storefront whenever you want.
            </p>
          </div>
        </section>

        <section className="dm-card p-6 sm:p-8 lg:p-10">
          <h2 className="text-base font-semibold tracking-tight">Our principle</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            A marketplace should not hide brands. Every listing in Midora Online is
            designed to improve brand visibility through shop badges, dynamic shop
            pages, and a discovery flow that introduces merchants as entities—not
            just commodities.
          </p>
        </section>
      </div>
    </>
  );
}
