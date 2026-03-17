export default function ProductListing() {
  return (
    <div className="space-y-6">
      <div className="dm-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Universal Product Feed
            </h1>
            <p className="mt-1 text-sm text-muted">
              Products with shop badges—brand visibility built in.
            </p>
          </div>
          <div className="grid w-full gap-3 md:max-w-xl md:grid-cols-3">
            <input
              className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm dm-focus"
              placeholder="Search products…"
            />
            <select className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm dm-focus">
              <option>All categories</option>
              <option>Electronics</option>
              <option>Fashion</option>
              <option>Groceries</option>
              <option>Home Care</option>
            </select>
            <select className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm dm-focus">
              <option>Sort: Newest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <section className="dm-card p-6">
        <p className="text-sm text-muted">
          The global product feed will connect directly to the Midora Online API.
          For now, browse products from each shop page.
        </p>
      </section>
    </div>
  );
}
  