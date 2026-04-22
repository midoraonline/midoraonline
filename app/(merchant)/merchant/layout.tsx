import type { ReactNode } from "react";

import DashboardShell, {
  type DashboardNavItem,
} from "@/components/dashboard/DashboardShell";

const NAV: DashboardNavItem[] = [
  { href: "/merchant", label: "Overview", icon: <IconHome />, exact: true },
  { href: "/merchant/shops", label: "My shops", icon: <IconStore /> },
  { href: "/merchant/orders", label: "Orders", icon: <IconBag /> },
];

const SECONDARY: DashboardNavItem[] = [
  { href: "/merchant/new", label: "Open a new shop", icon: <IconPlus /> },
];

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      role="merchant"
      roleLabel="Merchant"
      requiredRoles={["merchant", "admin"]}
      navItems={NAV}
      secondaryNavItems={SECONDARY}
      returnHref="/"
      returnLabel="Back to site"
    >
      {children}
    </DashboardShell>
  );
}

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12 12 3l9 9" />
      <path d="M5 10v10h14V10" />
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
function IconBag() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 7h12l-1 14H7L6 7Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
