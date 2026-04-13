export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="dm-card p-6 sm:p-8">
        <div className="h-7 w-40 rounded-xl bg-primary/10" />
        <div className="mt-3 h-4 w-80 max-w-full rounded-xl bg-primary/10" />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="h-11 rounded-2xl bg-primary/10" />
          <div className="h-11 rounded-2xl bg-primary/10" />
          <div className="h-11 rounded-2xl bg-primary/10" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="dm-card p-5">
            <div className="h-5 w-40 rounded-xl bg-primary/10" />
            <div className="mt-3 h-4 w-56 rounded-xl bg-primary/10" />
            <div className="mt-5 flex gap-2">
              <div className="h-7 w-24 rounded-full bg-primary/10" />
              <div className="h-7 w-24 rounded-full bg-primary/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}