import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-accent">
            SaaS-as-a-Mall
          </p>
          <h1 className="mt-3 text-pretty text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Rent a digital shop in 60 seconds.
          </h1>
          <p className="mt-4 text-base text-muted">
            Midora Online helps African brands stand out. Discover shops first,
            then products—so every purchase introduces you to the brand behind
            it.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/open-shop"
              className="dm-pill dm-focus bg-primary text-primary-foreground hover:opacity-95 transition-opacity px-5 py-3"
            >
              Spin up my shop
            </Link>
            <Link
              href="/shops"
              className="dm-pill dm-focus border border-border bg-surface text-foreground/85 hover:bg-primary/5 px-5 py-3"
            >
              Browse shops
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center rounded-full bg-primary/5 px-3 py-1 text-secondary">
              5,000 UGX/month
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/5 px-3 py-1 text-secondary">
              Brand-first discovery
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/5 px-3 py-1 text-secondary">
              AI-assisted management (soon)
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="dm-card p-5 sm:p-6">
          <p className="text-sm font-semibold">For merchants</p>
          <p className="mt-2 text-sm text-muted">
            Get a beautiful storefront without the cost of a full website.
          </p>
        </div>
        <div className="dm-card p-5 sm:p-6">
          <p className="text-sm font-semibold">For shoppers</p>
          <p className="mt-2 text-sm text-muted">
            Follow shops you love and discover new brands through products.
          </p>
        </div>
        <div className="dm-card p-5 sm:p-6">
          <p className="text-sm font-semibold">For trust</p>
          <p className="mt-2 text-sm text-muted">
            Verified badges, clear policies, and safer commerce by design.
          </p>
        </div>
      </section>

    </div>
  );
}
