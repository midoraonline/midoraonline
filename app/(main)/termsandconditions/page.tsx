export default function TermsAndConditions() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-10">
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-muted">Terms</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Terms & Conditions
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          This page is a structured placeholder for your legal terms. It’s
          aligned with the subscription rent model and the multi-tenant nature of
          Midora Online.
        </p>
      </section>

      <section className="grid gap-4 sm:gap-5">
        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            1. Subscription & Shop Access
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Shops rent space monthly (e.g. 5,000 UGX). If rent expires, the shop
            may display as “Temporarily Closed” until renewed.
          </p>
        </div>

        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            2. Merchant Responsibilities
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Merchants must provide accurate product information, comply with
            prohibited item rules, and fulfill orders responsibly.
          </p>
        </div>

        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            3. Customer Responsibilities
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Customers must use the platform lawfully and respect merchant
            policies and payment flows.
          </p>
        </div>

        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            4. Privacy & Data
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Midora Online applies privacy-first principles and secure processing.
            Full terms will specify data retention and user rights.
          </p>
        </div>
      </section>
    </div>
  );
}
