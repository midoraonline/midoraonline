"use client";

import MidoraInfoChat from "@/components/midoraInfoChat";

export default function MidoraInfoPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-10">
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-muted">Chat agent</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Midora Online info bot
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Ask anything about Midora Online and DigitalMall: what it is, how it
          works, capabilities, and how to get started. This assistant is
          separate from the in-shop concierge and does not use shop context.
        </p>
      </section>

      <MidoraInfoChat />
    </div>
  );
}
