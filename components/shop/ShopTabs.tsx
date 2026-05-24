"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useAppSession } from "@/lib/state";
import { canManageShopStorefront } from "@/lib/shop/storefront-access";

type TabId = "products" | "about" | "contacts" | "help";

export default function ShopTabs({
  products,
  about,
  contacts,
  concierge,
  shopSlug,
  shopId,
}: {
  products: ReactNode;
  about: ReactNode | null;
  contacts: ReactNode | null;
  concierge: ReactNode;
  shopSlug: string;
  shopId: string;
}) {
  const session = useAppSession();
  const canManage = canManageShopStorefront(session, shopId);
  const tabs: { id: TabId; label: string; content: ReactNode }[] = [
    { id: "products", label: "Products", content: products },
  ];
  if (about) tabs.push({ id: "about", label: "About", content: about });
  if (contacts) tabs.push({ id: "contacts", label: "Contacts", content: contacts });
  tabs.push({ id: "help", label: "Help", content: concierge });

  const [activeTab, setActiveTab] = useState<TabId>("products");
  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <>
      <div className="sticky top-14 z-30 -mx-3 border-b border-foreground/[0.08] bg-background px-3 sm:top-16 sm:-mx-5 sm:px-5 lg:-mx-7 lg:px-7">
        <div className="flex items-center gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors dm-focus whitespace-nowrap",
                  isActive ? "text-foreground" : "text-muted hover:text-foreground",
                ].join(" ")}
              >
                {tab.label}
                {isActive ? (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                ) : null}
              </button>
            );
          })}
          {canManage ? (
            <Link
              href={`/shops/${shopSlug}/analytics`}
              className="ml-auto flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-primary dm-focus"
            >
              <MaterialSymbol name="analytics" className="!text-[18px] leading-none" />
              <span className="hidden sm:inline">Analytics</span>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="pt-6 sm:pt-8">{activeContent}</div>
    </>
  );
}
