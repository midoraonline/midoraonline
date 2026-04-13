export default function ProductListing() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 sm:space-y-10">
      <div className="dm-card p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Universal Product Feed
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              Products with shop badges—brand visibility built in.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 md:max-w-xl md:grid-cols-3">
            <input className="dm-input" placeholder="Search products…" />
            <select className="dm-input appearance-none pr-10">
              <option>All categories</option>
              <option>Electronics</option>
              <option>Fashion</option>
              <option>Groceries</option>
              <option>Home Care</option>
            </select>
            <select className="dm-input appearance-none pr-10 sm:col-span-2 md:col-span-1">
              <option>Sort: Newest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <section className="dm-card p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-muted">
          The global product feed will connect directly to the Midora Online API.
          For now, browse products from each shop page.
        </p>
      </section>
    </div>
  );
}
