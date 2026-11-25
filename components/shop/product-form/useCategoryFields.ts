import { useEffect, useMemo, useState } from "react";
import { fetchCategoryFields } from "@/lib/api/categoryFields";
import { resolveCategoryParts } from "@/lib/categories";
import { useCategoryItems } from "@/lib/hooks/useCategoryItems";
import { withFileFields, type FileMetaField } from "@/lib/listingAttachment";
import { categoryMetaFieldsFromItems, normalizeCategoryFields } from "@/lib/listingMeta";

/** Category labels plus its meta fields (API-configured, else derived from the category tree). */
export function useCategoryFields(category: string) {
  const { items: categoryItems, tree: categoryTree } = useCategoryItems();
  const categoryParts = useMemo(() => resolveCategoryParts(category, categoryItems), [category, categoryItems]);
  const fieldIdentifier = categoryParts.subcategoryLabel || categoryParts.parentLabel || "";
  // Keyed by identifier so a stale response never shows for a newly picked category.
  const [fetched, setFetched] = useState<{ id: string; fields: FileMetaField[] | null } | null>(null);
  const remoteFields = fieldIdentifier !== "" && fetched?.id === fieldIdentifier ? fetched.fields : null;

  useEffect(() => {
    if (!fieldIdentifier) return;
    let cancelled = false;
    fetchCategoryFields(fieldIdentifier)
      .then((res) => {
        if (cancelled) return;
        setFetched({ id: fieldIdentifier, fields: res ? withFileFields(normalizeCategoryFields(res.fields), res.fields) : null });
      })
      .catch(() => {
        if (!cancelled) setFetched({ id: fieldIdentifier, fields: null });
      });
    return () => {
      cancelled = true;
    };
  }, [fieldIdentifier]);

  const catFields = useMemo(() => {
    if (remoteFields !== null) return remoteFields;
    return categoryMetaFieldsFromItems(categoryParts.parentLabel, categoryItems, categoryParts.subcategoryLabel);
  }, [remoteFields, categoryParts.parentLabel, categoryParts.subcategoryLabel, categoryItems]);

  const parentGroup = categoryTree.find((g) => g.parent.label === categoryParts.parentLabel);
  const parentHasChildren = !!parentGroup && parentGroup.children.length > 0;
  return { categoryParts, catFields, parentHasChildren };
}
