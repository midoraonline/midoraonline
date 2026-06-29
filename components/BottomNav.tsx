"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useAppSession } from "@/lib/state";

export default function BottomNav() {
  const pathname = usePathname();
  const session = useAppSession();

  const role = session.user?.user_role ?? null;
  const dashboardHref =
    role === "admin"
      ? "/admin"
      : role === "merchant"
      ? "/merchant"
      : "/customer";

  const tabs = [
    {
      label: "Home",
      href: "/",
      icon: "home",
    },
    {
      label: "Categories",
      href: "/products",
      icon: "grid_view",
    },
    {
      label: "Saved",
      href: "/customer/wishlist",
      icon: "favorite",
    },
    {
      label: "Shops",
      href: "/shops",
      icon: "storefront",
    },
    {
      label: "Account",
      href: dashboardHref,
      icon: "account_circle",
    },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 h-16 bg-white/90 backdrop-blur-md border-t border-neutral-200/80 z-50 flex items-center justify-around md:hidden pb-safe px-4 shadow-lg">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors dm-focus ${
              isActive ? "text-orange-600 font-bold" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <MaterialSymbol
              name={tab.icon}
              className={`!text-2xl ${isActive ? "text-orange-600" : "text-neutral-400"}`}
              filled={isActive}
            />
            <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
