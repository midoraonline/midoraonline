"use client";

import { useState, type ReactNode } from "react";

type TabId = "products" | "about" | "contacts" | "reviews" | "help";

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
    { id: "products", label: "Products", content: products },
  ];
  if (about) tabs.push({ id: "about", label: "About", content: about });
  if (contacts) tabs.push({ id: "contacts", label: "Contacts", content: contacts });
  tabs.push({ id: "reviews", label: "Reviews", content: reviews });
  tabs.push({ id: "help", label: "Help", content: concierge });

  const [activeTab, setActiveTab] = useState<TabId>("products");
  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <>
      <div className="-mx-3 border-b border-border bg-background px-3 sm:-mx-5 sm:px-5 lg:-mx-7 lg:px-7">
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent/10 text-accent shadow-sm"
                    : "text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 sm:pt-8">{activeContent}</div>
    </>
  );
}
