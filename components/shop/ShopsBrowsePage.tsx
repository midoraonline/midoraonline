"use client";

import { useMemo, useState } from "react";

import BrowseCategorySidebar from "@/components/browse/BrowseCategorySidebar";
import BrowseSearchBar from "@/components/browse/BrowseSearchBar";
import StickyBrowseToolbar from "@/components/browse/StickyBrowseToolbar";
import ShopListRealtime from "@/components/shop/ShopListRealtime";
import { useBrowseSidebarCollapse } from "@/hooks/useBrowseSidebarCollapse";
import { browseShopGridForSidebar, collectCategoriesFromShopProductMap } from "@/lib/browseCategories";
import type { Shop } from "@/lib/api/shops";

export default function ShopsBrowsePage({
  initialShops,
  shopProductCategories,
}: {
  initialShops: Shop[];
  shopProductCategories: Record<string, string[]>;
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { collapsed, setCollapsed } = useBrowseSidebarCollapse();

  const categories = useMemo(
    () => collectCategoriesFromShopProductMap(shopProductCategories),
    [shopProductCategories],
  );
  const categoryFilterActive = selectedCategory !== null;
  const q = query.trim();

  return (
    <div className="w-full">
      <div className="flex flex-row items-start gap-2 sm:gap-4 lg:gap-6">
        <BrowseCategorySidebar
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          listId="shops-browse-categories"
        />

        <div className="min-w-0 flex-1 space-y-4">
          <StickyBrowseToolbar>
            <div className="dm-card px-3 py-2 sm:px-4 sm:py-2.5">
              <BrowseSearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search shops…"
                ariaLabel="Search shops"
              />
            </div>
          </StickyBrowseToolbar>

          {(q.length > 0 || categoryFilterActive) && (
            <p className="text-sm text-muted">
              {q.length > 0 ? (
                <>
                  Results for <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
                  {categoryFilterActive ? (
                    <span>
                      {" "}
                      in <span className="font-semibold text-foreground">{selectedCategory}</span>
                    </span>
                  ) : null}{" "}
                  —{" "}
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="font-semibold text-foreground underline-offset-2 hover:underline"
                  >
                    clear search
                  </button>
                </>
              ) : (
                <>
                  Filtered by{" "}
                  <span className="font-semibold text-foreground">{selectedCategory}</span>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="font-semibold text-foreground underline-offset-2 hover:underline"
                  >
                    clear category
                  </button>
                </>
              )}
            </p>
          )}

          <ShopListRealtime
            initialShops={initialShops}
            shopProductCategories={shopProductCategories}
            productCategoryFilter={selectedCategory}
            searchQuery={query}
            gridClassName={browseShopGridForSidebar(collapsed)}
          />
        </div>
      </div>
    </div>
  );
}
