export default async function ProductDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <p className="text-sm font-semibold text-muted">Product</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Product details coming soon
        </h1>
        <p className="mt-3 text-sm text-muted max-w-xl">
          This page will show a full product view once the Midora Online API exposes
          a global product endpoint. For now, you reached this placeholder using
          the slug: <span className="font-mono text-foreground/90">{slug}</span>.
        </p>
      </section>
    </div>
  );
}