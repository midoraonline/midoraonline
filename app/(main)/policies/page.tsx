export default function Policies() {
  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <p className="text-sm font-semibold text-muted">Policies</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Trust & Safety on Midora Online
        </h1>
        <p className="mt-3 text-sm text-muted max-w-3xl">
          These sections are scaffolding for your full legal copy. They reflect
          the platform principles: vendor protection, customer protection, and
          privacy-first commerce.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="dm-card p-6">
          <h2 className="text-base font-semibold tracking-tight">
            Vendor Protection Policy
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <span className="font-semibold text-foreground/80">
                KYC verification:
              </span>{" "}
              Merchants verify ID/phone before payouts.
            </li>
            <li>
              <span className="font-semibold text-foreground/80">
                Data sovereignty:
              </span>{" "}
              Merchants own their customer lists.
            </li>
            <li>
              <span className="font-semibold text-foreground/80">
                Multi-tenant isolation:
              </span>{" "}
              Shop data is isolated via RLS in Supabase.
            </li>
          </ul>
        </div>

        <div className="dm-card p-6">
          <h2 className="text-base font-semibold tracking-tight">
            Customer Protection Policy
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <span className="font-semibold text-foreground/80">
                Verified badges:
              </span>{" "}
              Consistent subscriptions and good ratings earn verification.
            </li>
            <li>
              <span className="font-semibold text-foreground/80">
                Report mechanism:
              </span>{" "}
              A prominent report button for scam prevention.
            </li>
            <li>
              <span className="font-semibold text-foreground/80">Privacy:</span>{" "}
              Customer phone numbers stay hidden until a transaction starts.
            </li>
          </ul>
        </div>
      </section>

      <section className="dm-card p-6">
        <h2 className="text-base font-semibold tracking-tight">
          Platform Security
        </h2>
        <p className="mt-2 text-sm text-muted max-w-3xl">
          Sessions are secured via JWT/OAuth, rate limiting protects onboarding
          endpoints, and all data in transit is encrypted via HTTPS.
        </p>
      </section>
    </div>
  );
}
  