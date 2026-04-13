import ProductPageEffects from "@/components/product/ProductPageEffects";

export default async function ProductDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-10">
      <ProductPageEffects productId={slug} />
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-muted">Product</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Product details coming soon
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          This page will show a full product view once the Midora Online API exposes
          a global product endpoint. For now, you reached this placeholder using
          the slug: <span className="font-mono text-foreground/90">{slug}</span>.
        </p>
      </section>
    </div>
  );
}
