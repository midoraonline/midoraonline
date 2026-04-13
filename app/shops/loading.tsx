export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 sm:space-y-10">
      <div className="dm-card p-6 sm:p-8 lg:p-10">
        <div className="h-7 w-40 rounded-xl bg-foreground/[0.08]" />
        <div className="mt-3 h-4 w-80 max-w-full rounded-xl bg-foreground/[0.06]" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-11 rounded-2xl bg-foreground/[0.06]" />
          <div className="h-11 rounded-2xl bg-foreground/[0.06]" />
          <div className="h-11 rounded-2xl bg-foreground/[0.06] sm:col-span-2 lg:col-span-1" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="dm-card p-5 sm:p-6">
            <div className="h-5 w-40 rounded-xl bg-foreground/[0.08]" />
            <div className="mt-3 h-4 w-56 max-w-full rounded-xl bg-foreground/[0.06]" />
            <div className="mt-5 flex flex-wrap gap-2">
              <div className="h-7 w-24 rounded-full bg-foreground/[0.06]" />
              <div className="h-7 w-24 rounded-full bg-foreground/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
