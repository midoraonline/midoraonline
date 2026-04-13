export default function Policies() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-10">
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-muted">Policies</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Trust & Safety on Midora Online
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          These sections are scaffolding for your full legal copy. They reflect
          the platform principles: vendor protection, customer protection, and
          privacy-first commerce.
        </p>
      </section>

      <section className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            Vendor Protection Policy
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li>
              <span className="font-semibold text-foreground/85">
                KYC verification:
              </span>{" "}
              Merchants verify ID/phone before payouts.
            </li>
            <li>
              <span className="font-semibold text-foreground/85">
                Data sovereignty:
              </span>{" "}
              Merchants own their customer lists.
            </li>
            <li>
              <span className="font-semibold text-foreground/85">
                Multi-tenant isolation:
              </span>{" "}
              Shop data is isolated via RLS in Supabase.
            </li>
          </ul>
        </div>

        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            Customer Protection Policy
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li>
              <span className="font-semibold text-foreground/85">
                Verified badges:
              </span>{" "}
              Consistent subscriptions and good ratings earn verification.
            </li>
            <li>
              <span className="font-semibold text-foreground/85">
                Report mechanism:
              </span>{" "}
              A prominent report button for scam prevention.
            </li>
            <li>
              <span className="font-semibold text-foreground/85">Privacy:</span>{" "}
              Customer phone numbers stay hidden until a transaction starts.
            </li>
          </ul>
        </div>
      </section>

      <section className="dm-card p-6 sm:p-8">
        <h2 className="text-base font-semibold tracking-tight">
          Platform Security
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          Sessions are secured via JWT/OAuth, rate limiting protects onboarding
          endpoints, and all data in transit is encrypted via HTTPS.
        </p>
      </section>
    </div>
  );
}
