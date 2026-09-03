"use client";

import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useTheme, type ThemeMode } from "@/components/providers/ThemeProvider";

const ICONS: Record<ThemeMode, string> = {
  light: "light_mode",
  dark: "dark_mode",
  system: "computer",
};

const LABELS: Record<ThemeMode, string> = {
  light: "Light theme",
  dark: "Dark theme",
  system: "System theme",
};

/**
 * Single-button theme toggle. Cycles light → dark → system.
 * Small (size-9) so it drops into any header action row without
 * enlarging the row.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, toggle } = useTheme();
  const nextMode: ThemeMode =
    mode === "light" ? "dark" : mode === "dark" ? "system" : "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${LABELS[nextMode].toLowerCase()}. Current: ${LABELS[mode].toLowerCase()}.`}
      title={`Theme: ${LABELS[mode]}`}
      className={[
        "inline-flex size-9 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground dm-focus",
        className,
      ].join(" ")}
    >
      <MaterialSymbol name={ICONS[mode]} className="!text-lg" />
    </button>
  );
}
