export default function Policies() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-10">
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-muted">Policies</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Trust and safety on Midora Online
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          This is a short summary of how we protect sellers, buyers and your
          privacy. We&apos;re still preparing the full policies, and we&apos;ll
          publish them on this page.
        </p>
      </section>

      <section className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            How we protect sellers
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li>
              <span className="font-semibold text-foreground/85">
                Identity checks:
              </span>{" "}
              Shop owners can send us their ID and a selfie for our team to
              check. New shops show in the shop list only after we approve them.
            </li>
            <li>
              <span className="font-semibold text-foreground/85">
                Your customers stay yours:
              </span>{" "}
              Shop owners own their customer lists.
            </li>
            <li>
              <span className="font-semibold text-foreground/85">
                Separate shop data:
              </span>{" "}
              Each shop&apos;s data is kept separate, so other shops can&apos;t
              see it.
            </li>
          </ul>
        </div>

        <div className="dm-card p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">
            How we protect buyers
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li>
              <span className="font-semibold text-foreground/85">
                Verified badges:
              </span>{" "}
              Badges show what we checked. &ldquo;ID verified&rdquo; means our
              team checked the owner&apos;s ID. &ldquo;Verified business&rdquo;
              and &ldquo;Verified professional&rdquo; mean we also checked a
              shop photo or business registration, or a professional licence. A verified
              WhatsApp number means the shop confirmed it with a code we sent
              through WhatsApp. If a shop&apos;s WhatsApp isn&apos;t verified,
              you can message the seller on Midora instead.
            </li>
            <li>
              <span className="font-semibold text-foreground/85">
                Reporting:
              </span>{" "}
              Use the report button if you see a scam or something wrong. We&apos;ll
              review it.
            </li>
            <li>
              <span className="font-semibold text-foreground/85">Privacy:</span>{" "}
              When you message a seller on Midora, they see your name and photo,
              not your phone number.
            </li>
          </ul>
        </div>
      </section>

      <section className="dm-card p-6 sm:p-8">
        <h2 className="text-base font-semibold tracking-tight">
          Keeping your account secure
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          We protect your sign-in with secure, industry-standard methods. We
          limit repeated attempts to stop abuse, and all data sent between your
          phone and Midora is encrypted.
        </p>
      </section>
    </div>
  );
}
