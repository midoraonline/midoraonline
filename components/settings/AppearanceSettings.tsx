"use client";

import { toast } from "sonner";
import { SettingsPanel, SettingsRow } from "@/components/settings/SettingsSection";
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
    <SettingsPanel>
      <SettingsRow title="Theme" description="Light, dark or follow your device. Applies right away.">
        <ThemeSelector onChange={onChange} />
      </SettingsRow>
    </SettingsPanel>
  );
}
