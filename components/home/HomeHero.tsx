"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import HeroActions from "@/components/home/HeroActions";

export default function HomeHero() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-lg font-bold leading-tight tracking-tight text-foreground sm:text-xl">
            Find what you need near you — <span className="text-accent">fast.</span>
          </h1>
        </div>

        <HeroActions />
      </div>

      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search Midora"
        className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface-subtle/60 px-2.5 py-1 focus-within:border-accent/40 focus-within:bg-surface"
      >
        <Search className="size-4 shrink-0 text-muted" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search phones, tailors, tomatoes, jobs…"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-accent px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-accent-hover"
        >
          Search
        </button>
      </form>
    </section>
  );
}
