"use client";

import AccountSecuritySettings from "@/components/settings/AccountSecuritySettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import ProfileSettings from "@/components/settings/ProfileSettings";
import { PageHeader, UnderlineTabs, useTabParam } from "@/components/dashboard/ui";

const SECTIONS = [
  { value: "profile", label: "Profile" },
  { value: "appearance", label: "Appearance" },
  { value: "notifications", label: "Notifications" },
  { value: "account", label: "Account" },
] as const;

const KEYS = SECTIONS.map((s) => s.value);

export default function AccountSettings() {
  const [section, setSection] = useTabParam(KEYS, "profile");

  return (
    <div>
      <PageHeader title="Settings" description="Your profile, theme, notifications and sign-in." />
      <UnderlineTabs tabs={SECTIONS} value={section} onChange={setSection} />
      {section === "profile" ? <ProfileSettings /> : null}
      {section === "appearance" ? <AppearanceSettings /> : null}
      {section === "notifications" ? <NotificationSettings /> : null}
      {section === "account" ? <AccountSecuritySettings /> : null}
    </div>
  );
}
