"use client";

import MidoraInfoChat from "@/components/midoraInfoChat";

export default function MidoraInfoPage() {
  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <p className="text-sm font-semibold text-muted">Chat agent</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Midora Online info bot
        </h1>
        <p className="mt-3 text-sm text-muted max-w-2xl">
          Ask anything about Midora Online and DigitalMall: what it is, how it
          works, capabilities, and how to get started. This assistant is
          separate from the in-shop concierge and does not use shop context.
        </p>
      </section>

      <MidoraInfoChat />
    </div>
  );
}

