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
      <p className="px-3 py-2 text-sm font-semibold text-foreground/90">
        {title}
      </p>
      <nav className="mt-1 flex flex-col gap-1" aria-label={title}>
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
                "rounded-2xl px-3 py-2 text-sm font-medium dm-focus transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:bg-primary/5",
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