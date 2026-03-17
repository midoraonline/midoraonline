import OpenShopWizard from "@/components/openShopWizard";

export default function OpenShopPage() {
  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Open a digital shop
        </h1>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Start with the basics, give the AI concierge a short brief, and get a
          shareable link for your storefront.
        </p>
      </section>

      <OpenShopWizard />
    </div>
  );
}

