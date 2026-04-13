export default function ContactUs() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 sm:space-y-10">
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-muted">Contact</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Talk to the Midora Online team
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Questions about opening a shop, subscriptions, or partnerships? Send a
          message—this form is a UI placeholder for now.
        </p>
      </section>

      <section className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="dm-card p-6 sm:p-7 lg:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">Message</h2>
          <form className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="dm-input" placeholder="Full name" />
              <input className="dm-input" placeholder="Email" type="email" />
            </div>
            <input className="dm-input" placeholder="Subject" />
            <textarea className="dm-textarea" placeholder="Your message" />
            <button
              type="button"
              className="dm-pill dm-focus w-full justify-self-start bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 sm:w-auto"
              disabled
            >
              Send (soon)
            </button>
          </form>
        </div>

        <div className="dm-card flex flex-col p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">Details</h2>
          <div className="mt-4 flex flex-1 flex-col justify-center space-y-3 text-sm text-muted">
            <p>
              <span className="font-semibold text-foreground/85">Email:</span>{" "}
              support@digitalmall.ug
            </p>
            <p>
              <span className="font-semibold text-foreground/85">Location:</span>{" "}
              Kampala, Uganda
            </p>
            <p>
              <span className="font-semibold text-foreground/85">Hours:</span>{" "}
              Mon–Sat, 9am–6pm
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
