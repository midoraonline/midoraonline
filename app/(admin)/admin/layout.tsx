import type { ReactNode } from "react";

import DashboardShell, {
  type DashboardNavItem,
} from "@/components/dashboard/DashboardShell";

const NAV: DashboardNavItem[] = [
  { href: "/admin", label: "Overview", icon: <IconChart />, exact: true },
  { href: "/admin/verifications", label: "Verifications", icon: <IconShield /> },
  { href: "/admin/shops", label: "Shops", icon: <IconStore /> },
];

const SECONDARY: DashboardNavItem[] = [
  { href: "/admin/subscriptions", label: "Subscriptions", icon: <IconReceipt /> },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      role="admin"
      roleLabel="Admin"
      requiredRoles={["admin"]}
      navItems={NAV}
      secondaryNavItems={SECONDARY}
      returnHref="/"
      returnLabel="Back to site"
      contentWidth="wide"
    >
      {children}
    </DashboardShell>
  );
}

function IconChart() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IconStore() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9 5 4h14l2 5" />
      <path d="M4 9h16v11H4z" />
      <path d="M10 14h4" />
    </svg>
  );
}
function IconReceipt() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}
