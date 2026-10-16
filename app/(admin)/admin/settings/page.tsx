import Link from "next/link";
import AccountSettings from "@/components/settings/AccountSettings";
import { CARD } from "@/components/dashboard/ui";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/plans"
        className={`${CARD} flex items-center justify-between gap-3 p-4 text-sm transition-colors hover:border-accent/50`}
      >
        <span>
          <span className="block font-semibold text-foreground">Plans & limits</span>
          <span className="block text-muted">Plan prices, listing caps, media limits (photos and videos), boosts and reposts</span>
        </span>
        <span className="shrink-0 font-medium text-accent">Open Plans →</span>
      </Link>
      <AccountSettings />
    </div>
  );
}
