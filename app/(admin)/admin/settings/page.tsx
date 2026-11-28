import Link from "next/link";
import AccountSettings from "@/components/settings/AccountSettings";
import WhatsAppConnectionCard from "@/components/admin/WhatsAppConnectionCard";
import { CARD } from "@/components/dashboard/ui";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/plans"
        className={`${CARD} flex items-center justify-between gap-3 p-4 text-sm transition-colors hover:border-accent/50`}
      >
        <span>
          <span className="block font-semibold text-foreground">Plans and limits</span>
          <span className="block text-muted">Plan prices, listing limits, photo and video limits, boosts and reposts</span>
        </span>
        <span className="shrink-0 font-medium text-accent">Open plans →</span>
      </Link>
      <WhatsAppConnectionCard />
      <AccountSettings />
    </div>
  );
}
