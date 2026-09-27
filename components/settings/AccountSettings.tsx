"use client";

import { useState } from "react";
import AccountSecuritySettings from "@/components/settings/AccountSecuritySettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import ProfileSettings from "@/components/settings/ProfileSettings";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export default function AccountSettings() {
  const [section, setSection] = useState<SectionId>("profile");

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto md:w-44 md:shrink-0 md:flex-col">
        {SECTIONS.map((item) => {
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => setSection(item.id)}
              className={`dm-focus min-h-11 shrink-0 rounded-xl px-3 text-left text-sm font-semibold ${
                active ? "bg-accent text-white" : "bg-surface text-foreground hover:bg-surface-subtle"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="min-w-0 flex-1">
        {section === "profile" ? <ProfileSettings /> : null}
        {section === "appearance" ? <AppearanceSettings /> : null}
        {section === "notifications" ? <NotificationSettings /> : null}
        {section === "account" ? <AccountSecuritySettings /> : null}
      </div>
    </div>
  );
}
