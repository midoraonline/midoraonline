"use client";

import { toast } from "sonner";
import { SettingsPanel, SettingsRow } from "@/components/settings/SettingsSection";
import ThemeSelector from "@/components/ThemeSelector";
import type { ThemePreference } from "@/lib/api/auth";
import { saveAccountPreferences } from "@/lib/accountPreferences";
import { ALL_UGANDA, BROWSE_AREAS, useBrowseArea } from "@/lib/browseArea";

export default function AppearanceSettings() {
  const browse = useBrowseArea();

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
      <SettingsRow
        title="Browsing area"
        description="Home shows listings here first, then nearby areas and the rest of Uganda. Search and filters still follow what you ask for."
      >
        <select
          aria-label="Browsing area"
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
          value={browse.saved ?? ALL_UGANDA}
          onChange={(e) => {
            browse.setArea(e.target.value, true);
            toast.success("Browsing area saved");
          }}
        >
          <option value={ALL_UGANDA}>All Uganda</option>
          {BROWSE_AREAS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </SettingsRow>
    </SettingsPanel>
  );
}
