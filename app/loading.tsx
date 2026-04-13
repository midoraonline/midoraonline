export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-foreground">
      <div
        className="size-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
        aria-hidden
      />
      <p className="mt-4 text-sm text-foreground/70">Loading…</p>
    </div>
  );
}
