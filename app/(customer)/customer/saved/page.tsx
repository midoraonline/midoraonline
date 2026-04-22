import Link from "next/link";

export default function CustomerSavedPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Customer
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Saved shops
        </h1>
        <p className="mt-2 text-sm text-muted">
          Follow shops to quickly come back to them.
        </p>
      </header>

      <div className="dm-card p-8 text-center text-sm text-muted">
        <p>A shop you follow will appear here.</p>
        <Link
          href="/shops"
          className="dm-pill dm-focus mt-5 inline-flex bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95"
        >
          Discover shops →
        </Link>
      </div>
    </div>
  );
}
