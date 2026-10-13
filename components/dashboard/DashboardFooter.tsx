import Link from "next/link";

const LINKS = [
  { label: "Privacy", href: "/policies" },
  { label: "Terms", href: "/termsandconditions" },
  { label: "Help", href: "/contactus" },
];

export default function DashboardFooter() {
  return (
    <footer className="border-t border-border">
      <div className="flex flex-col items-center gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:justify-between lg:px-6">
        <p>© {new Date().getFullYear()} Midora</p>
        <nav className="flex gap-4">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
