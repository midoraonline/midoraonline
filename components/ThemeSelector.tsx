"use client";

import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useTheme, type ThemeMode } from "@/components/providers/ThemeProvider";

const OPTIONS: { mode: ThemeMode; label: string; icon: string; hint: string }[] = [
  { mode: "system", label: "System", icon: "computer",    hint: "Match your device" },
  { mode: "light",  label: "Light",  icon: "light_mode",  hint: "Bright surfaces" },
  { mode: "dark",   label: "Dark",   icon: "dark_mode",   hint: "Reduced glare" },
];

/**
 * Compact three-way theme picker for settings pages. Mirrors the same
 * localStorage key ("midora-theme") the pre-hydration script reads, so the
 * chosen mode survives reloads with zero flash.
 */
export default function ThemeSelector() {
  const { mode, setMode } = useTheme();

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {OPTIONS.map((opt) => {
        const active = mode === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => setMode(opt.mode)}
            aria-pressed={active}
            className={[
              "dm-focus flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
              active
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:bg-surface-subtle",
            ].join(" ")}
          >
            <span
              className={[
                "grid size-9 shrink-0 place-items-center rounded-lg",
                active ? "bg-accent text-white" : "bg-surface-subtle text-foreground/70",
              ].join(" ")}
            >
              <MaterialSymbol name={opt.icon} className="!text-lg" />
            </span>
            <span className="min-w-0">
              <span className={["block text-sm font-semibold", active ? "text-accent" : "text-foreground"].join(" ")}>
                {opt.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted">{opt.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
