export default function CustomerOrdersPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Customer
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          My orders
        </h1>
      </header>
      <div className="dm-card p-8 text-center text-sm text-muted">
        You haven&apos;t placed any orders yet. When you do, they&apos;ll show up here.
      </div>
    </div>
  );
}
