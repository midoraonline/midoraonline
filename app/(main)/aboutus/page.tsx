export default function AboutUs() {
  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <p className="text-sm font-semibold text-muted">About</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Midora Online is brand-first commerce.
        </h1>
        <p className="mt-3 text-sm text-muted max-w-2xl">
          Midora Online modernizes African commerce by helping merchants rent a
          professional digital space for an affordable monthly fee. Shops are
          the primary entity—products always point back to the brand behind
          them.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="dm-card p-6">
          <h2 className="text-base font-semibold tracking-tight">
            For merchants
          </h2>
          <p className="mt-2 text-sm text-muted">
            Spin up a storefront quickly, upload products, and use AI to generate
            titles, descriptions, and tags from a single photo.
          </p>
        </div>
        <div className="dm-card p-6">
          <h2 className="text-base font-semibold tracking-tight">For shoppers</h2>
          <p className="mt-2 text-sm text-muted">
            Follow shops you love, discover new brands through products, and
            return to the storefront whenever you want.
          </p>
        </div>
      </section>

      <section className="dm-card p-6">
        <h2 className="text-base font-semibold tracking-tight">Our principle</h2>
        <p className="mt-2 text-sm text-muted max-w-3xl">
          A marketplace should not hide brands. Every listing in Midora Online is
          designed to improve brand visibility through shop badges, dynamic shop
          pages, and a discovery flow that introduces merchants as entities—not
          just commodities.
        </p>
      </section>
    </div>
  );
}
  