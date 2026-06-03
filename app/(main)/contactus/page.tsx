"use client";

import { useState, FormEvent } from "react";
import { apiContactus } from "@/lib/api";
import { MaterialSymbol } from "@/components/MaterialSymbol";

export default function ContactUs() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !subject || !message) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiContactus.submitContactForm({
        full_name: fullName,
        email,
        subject,
        message,
      });
      if ("error" in res) {
        setError(res.error as string);
        return;
      }
      setDone(true);
    } catch {
      setError("Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 sm:space-y-10">
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-muted">Contact</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Talk to the Midora Online team
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Questions about opening a shop, subscriptions, or partnerships? Send us a message and we&apos;ll get back to you.
        </p>
      </section>

      <section className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="dm-card p-6 sm:p-7 lg:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">Message</h2>
          {done ? (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
              <MaterialSymbol name="check_circle" className="!text-lg" />
              Thank you! We&apos;ll get back to you soon.
            </div>
          ) : (
            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="dm-input"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <input
                  className="dm-input"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <input
                className="dm-input"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <textarea
                className="dm-textarea"
                placeholder="Your message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              {error && (
                <p className="text-xs text-rose-500">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting || !fullName || !email || !subject || !message}
                className="dm-pill dm-focus w-full justify-self-start bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-50 sm:w-auto"
              >
                {submitting ? "Sending..." : "Send message"}
              </button>
            </form>
          )}
        </div>

        <div className="dm-card flex flex-col p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight">Details</h2>
          <div className="mt-4 flex flex-1 flex-col justify-center space-y-3 text-sm text-muted">
            <p>
              <span className="font-semibold text-foreground/85">Email:</span>{" "}
              midoraonline@gmail.com
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
