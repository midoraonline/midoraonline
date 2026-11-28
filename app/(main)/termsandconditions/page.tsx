import Link from "next/link";

export default function TermsAndConditions() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-10">
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-muted">Terms</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Terms and conditions
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          This is a short summary of the rules for using Midora Online. We&apos;re
          still preparing the full terms, and we&apos;ll publish them on this page.
        </p>
      </section>

      <section className="grid gap-4 sm:gap-5">
        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            1. Shop plans and access
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Every shop starts on the free Basic plan. Paid plans give more
            shops, more listings, shop stats and free boosts. You can see each
            plan&apos;s price in UGX and how long it lasts on the{" "}
            <Link href="/merchant/billing" className="font-semibold text-foreground underline-offset-2 hover:underline">
              Billing and plans
            </Link>{" "}
            page before you pay. When a paid plan ends, your shop goes back to
            the Basic plan and its limits until you renew.
          </p>
        </div>

        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            2. What sellers must do
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Sellers must give accurate information about what they sell, follow
            the rules on banned items, and answer buyers honestly and politely.
          </p>
        </div>

        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            3. What buyers must do
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Buyers must use Midora Online within the law and respect each
            shop&apos;s own rules and payment steps.
          </p>
        </div>

        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            4. Privacy and your data
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            We collect only what we need and keep your data secure. The full
            terms will explain how long we keep your data and what your rights
            are.
          </p>
        </div>
      </section>
    </div>
  );
}
