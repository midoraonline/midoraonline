"use client";

import { toast } from "sonner";
import ThemeSelector from "@/components/ThemeSelector";
import type { ThemePreference } from "@/lib/api/auth";
import { saveAccountPreferences } from "@/lib/accountPreferences";

export default function AppearanceSettings() {
  async function onChange(theme: ThemePreference) {
    try {
      const where = await saveAccountPreferences({ theme });
      if (where === "local") toast.message("Theme saved on this device.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save theme.");
    }
  }

  return (
    <section className="dm-card space-y-4 p-4 sm:p-6">
      <div>
        <h2 className="text-sm font-semibold">Appearance</h2>
        <p className="mt-0.5 text-xs text-muted">Applies right away and stays on this device.</p>
      </div>
      <ThemeSelector onChange={onChange} />
    </section>
  );
}
