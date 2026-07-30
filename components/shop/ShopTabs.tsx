"use client";

import { useState, type ReactNode } from "react";

type TabId = "products" | "about" | "contacts" | "reviews" | "help";

/**
 * Storefront section nav — chip strip, scrollable on mobile.
 * Catalog first; About / Contacts / Reviews / Help as secondary destinations.
 */
export default function ShopTabs({
  products,
  about,
  contacts,
  reviews,
  concierge,
}: {
  products: ReactNode;
  about: ReactNode | null;
  contacts: ReactNode | null;
  reviews: ReactNode;
  concierge: ReactNode;
  shopSlug?: string;
  shopId?: string;
}) {
  const tabs: { id: TabId; label: string; content: ReactNode }[] = [
    { id: "products", label: "Shop", content: products },
  ];
  if (about) tabs.push({ id: "about", label: "About", content: about });
  if (contacts) tabs.push({ id: "contacts", label: "Contact", content: contacts });
  tabs.push({ id: "reviews", label: "Reviews", content: reviews });
  tabs.push({ id: "help", label: "Help", content: concierge });

  const [activeTab, setActiveTab] = useState<TabId>("products");
  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <>
      <div className="sticky top-14 z-20 -mx-3 border-b border-border/80 bg-background/95 px-3 backdrop-blur-md sm:-mx-5 sm:px-5 lg:-mx-7 lg:px-7">
        <nav
          className="flex items-center gap-1.5 overflow-x-auto py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Shop sections"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-10 shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:bg-foreground/[0.05] hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-5 sm:pt-7">{activeContent}</div>
    </>
  );
}
