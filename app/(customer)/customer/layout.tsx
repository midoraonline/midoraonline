import type { ReactNode } from "react";

import DashboardShell, {
  type DashboardNavItem,
} from "@/components/dashboard/DashboardShell";

const NAV: DashboardNavItem[] = [
  { href: "/customer", label: "Overview", icon: <IconHome />, exact: true },
  { href: "/customer/profile", label: "Profile", icon: <IconUser /> },
  { href: "/customer/orders", label: "Orders", icon: <IconBag /> },
  { href: "/customer/saved", label: "Saved shops", icon: <IconHeart /> },
];

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      role="customer"
      roleLabel="Customer"
      requiredRoles={["customer", "merchant", "admin"]}
      navItems={NAV}
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
function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 16 0v1" />
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
function IconHeart() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10Z" />
    </svg>
  );
}
