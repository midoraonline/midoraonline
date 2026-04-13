export default function ContactUs() {
  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <p className="text-sm font-semibold text-muted">Contact</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Talk to the Midora Online team
        </h1>
        <p className="mt-3 text-sm text-muted max-w-2xl">
          Questions about opening a shop, subscriptions, or partnerships? Send a
          message—this form is a UI placeholder for now.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="dm-card p-6 lg:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">Message</h2>
          <form className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm dm-focus"
                placeholder="Full name"
              />
              <input
                className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm dm-focus"
                placeholder="Email"
                type="email"
              />
            </div>
            <input
              className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm dm-focus"
              placeholder="Subject"
            />
            <textarea
              className="min-h-32 rounded-2xl border border-border bg-surface px-4 py-3 text-sm dm-focus"
              placeholder="Your message"
            />
            <button
              type="button"
              className="dm-pill dm-focus bg-primary text-primary-foreground hover:opacity-95 transition-opacity px-5 py-3 justify-self-start"
              disabled
            >
              Send (soon)
            </button>
          </form>
        </div>

        <div className="dm-card p-6">
          <h2 className="text-base font-semibold tracking-tight">Details</h2>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p>
              <span className="font-semibold text-foreground/80">Email:</span>{" "}
              support@digitalmall.ug
            </p>
            <p>
              <span className="font-semibold text-foreground/80">Location:</span>{" "}
              Kampala, Uganda
            </p>
            <p>
              <span className="font-semibold text-foreground/80">Hours:</span>{" "}
              Mon–Sat, 9am–6pm
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
  