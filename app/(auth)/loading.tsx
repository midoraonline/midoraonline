export default function AuthLoading() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading">
      <div className="space-y-2 text-center">
        <div className="mx-auto h-7 w-40 animate-pulse rounded-lg bg-surface-muted" />
        <div className="mx-auto h-4 w-56 animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="h-11 animate-pulse rounded-xl bg-surface-muted" />
      <div className="h-11 animate-pulse rounded-xl bg-surface-muted" />
      <div className="h-11 animate-pulse rounded-xl bg-surface-muted" />
      <div className="h-11 animate-pulse rounded-xl bg-accent/30" />
    </div>
  );
}
