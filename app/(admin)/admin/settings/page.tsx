import Link from "next/link";
import AccountSettings from "@/components/settings/AccountSettings";
import { CARD } from "@/components/dashboard/ui";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/features#media-limits"
        className={`${CARD} flex items-center justify-between gap-3 p-4 text-sm transition-colors hover:border-accent/50`}
      >
        <span>
          <span className="block font-semibold text-foreground">Platform settings</span>
          <span className="block text-muted">Listing media limits (max photos and videos) and feature switches</span>
        </span>
        <span className="shrink-0 font-medium text-accent">Open Features →</span>
      </Link>
      <AccountSettings />
    </div>
  );
}
