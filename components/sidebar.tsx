"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarItem = {
  href: string;
  label: string;
};

export default function Sidebar({
  title = "Menu",
  items,
}: {
  title?: string;
  items: SidebarItem[];
}) {
  const pathname = usePathname();

  return (
    <aside className="dm-card p-3">
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
        {title}
      </p>
      <nav className="mt-1 flex flex-col gap-0.5" aria-label={title}>
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium dm-focus transition-colors",
                active
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-foreground/70 hover:bg-surface-subtle hover:text-foreground",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
