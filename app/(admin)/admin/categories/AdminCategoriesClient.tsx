"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiAdmin } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api/base";
import type { AdminCategory } from "@/lib/api/admin";
import type { IntentModeRow } from "@/lib/api/categories";
import CategoryFieldsEditor from "@/components/admin/CategoryFieldsEditor";
import CategoryIntentModeControl from "@/components/admin/CategoryIntentModeControl";
import {
  CATEGORY_META_FIELD_KEY_OPTIONS,
  categoryMetaFields,
  normalizeCategoryFields,
} from "@/lib/listingMeta";

/** Stored parent fields, or the built-in ones the listing form uses today. */
function parentFieldsInUse(parent: AdminCategory) {
  const stored = parent.metadata ?? [];
  return stored.length > 0 ? stored : categoryMetaFields(parent.label);
}
import { ErrorState, PageHeader, PageSkeleton } from "@/components/dashboard/ui";

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesClient() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedChildFields, setExpandedChildFields] = useState<Record<string, boolean>>({});
  const [newParentLabel, setNewParentLabel] = useState("");
  const [newChildLabel, setNewChildLabel] = useState<Record<string, string>>({});
  const [intentModes, setIntentModes] = useState<Record<string, IntentModeRow>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, modes] = await Promise.all([
        apiAdmin.adminListCategories(),
        apiAdmin.adminListIntentModes().catch(() => [] as IntentModeRow[]),
      ]);
      setIntentModes(Object.fromEntries(modes.map((m) => [m.slug, m])));
      setCategories(
        (Array.isArray(rows) ? rows : []).map((row) => {
          const metadata = normalizeCategoryFields(row.metadata ?? row.fields);
          return {
            ...row,
            metadata,
            ...(row.effective_fields !== undefined
              ? { effective_fields: normalizeCategoryFields(row.effective_fields) }
              : {}),
          };
        }),
      );
    } catch (err) {
      setError(apiErrorMessage(err, "We couldn't load categories. Try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const parents = useMemo(
    () => categories.filter((c) => !c.parent_slug).sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );
  const childrenByParent = useMemo(() => {
    const map: Record<string, AdminCategory[]> = {};
    for (const c of categories) {
      if (!c.parent_slug) continue;
      (map[c.parent_slug] ??= []).push(c);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [categories]);

  async function addParent() {
    const label = newParentLabel.trim();
    if (!label) return;
    try {
      await apiAdmin.adminCreateCategory({
        slug: slugify(label),
        label,
        sort_order: parents.length + 1,
      });
      setNewParentLabel("");
      toast.success("Category added.");
      void load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "We couldn't add that category. Try again."));
    }
  }

  async function addChild(parentSlug: string) {
    const label = (newChildLabel[parentSlug] ?? "").trim();
    if (!label) return;
    try {
      await apiAdmin.adminCreateCategory({
        slug: `${parentSlug}-${slugify(label)}`,
        label,
        parent_slug: parentSlug,
        sort_order: (childrenByParent[parentSlug]?.length ?? 0) + 1,
      });
      setNewChildLabel((s) => ({ ...s, [parentSlug]: "" }));
      toast.success("Subcategory added.");
      void load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "We couldn't add that subcategory. Try again."));
    }
  }

  async function removeCategory(slug: string) {
    if (!window.confirm("Delete this category? Sellers won't be able to choose it any more. You can't undo this.")) return;
    try {
      await apiAdmin.adminDeleteCategory(slug);
      toast.success("Category deleted.");
      void load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "We couldn't delete that category. Try again."));
    }
  }

  async function renameCategory(slug: string, label: string) {
    if (!label.trim()) return;
    try {
      await apiAdmin.adminUpdateCategory(slug, { label: label.trim() });
      toast.success("Name saved.");
      void load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "We couldn't save that name. Try again."));
    }
  }

  // After saves we reload in place: keep editors mounted (open panels, drafts).
  if (loading && categories.length === 0) {
    return <PageSkeleton rows={6} label="Loading categories" />;
  }

    return (
    <>
      <datalist id="category-meta-field-keys">
        {CATEGORY_META_FIELD_KEY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} />
        ))}
      </datalist>
      <div className="space-y-6">
        <PageHeader
          title="Categories"
          description="Categories, subcategories and the extra listing fields sellers fill in."
        />

        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

        <div className="flex flex-wrap items-center gap-2">
          <input
            className="dm-input flex-1 min-w-[200px]"
            value={newParentLabel}
            onChange={(e) => setNewParentLabel(e.target.value)}
            placeholder="New top-level category name"
            aria-label="New top-level category name"
          />
          <button type="button" onClick={() => void addParent()} className="dm-btn dm-btn-primary dm-btn-sm">
            + Add category
          </button>
        </div>

        <div className="space-y-3">
          {parents.map((parent) => {
            const children = childrenByParent[parent.slug] ?? [];
            const isOpen = expanded[parent.slug] ?? false;
            return (
              <div key={parent.slug} className="rounded-xl border border-border bg-surface shadow-xs p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExpanded((s) => ({ ...s, [parent.slug]: !isOpen }))}
                    className="text-xs font-semibold text-muted hover:text-foreground"
                    aria-expanded={isOpen}
                    aria-label={isOpen ? `Collapse ${parent.label}` : `Expand ${parent.label}`}
                  >
                    {isOpen ? "▾" : "▸"}
                  </button>
                  <input
                    className="dm-input flex-1 min-w-[160px] font-semibold"
                    defaultValue={parent.label}
                    key={parent.label}
                    aria-label="Category name"
                    onBlur={(e) => {
                      if (e.target.value.trim() !== parent.label) {
                        void renameCategory(parent.slug, e.target.value);
                      }
                    }}
                  />
                  <span className="text-xs text-muted">
                    {children.length} subcategor{children.length === 1 ? "y" : "ies"}
                  </span>
                  <button
                    type="button"
                    onClick={() => void removeCategory(parent.slug)}
                    disabled={children.length > 0}
                    title={children.length > 0 ? "Delete its subcategories first" : undefined}
                    className="text-xs font-semibold text-rose-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete category
                  </button>
                </div>

                {isOpen ? (
                  <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
                    <div className="space-y-2">
                      {children.map((child) => {
                        const childFieldsOpen = expandedChildFields[child.slug] ?? false;
                        return (
                          <div key={child.slug} className="space-y-2">
                            <div className="flex items-center gap-2 pl-6">
                              <input
                                className="dm-input flex-1"
                                defaultValue={child.label}
                                key={child.label}
                                aria-label="Subcategory name"
                                onBlur={(e) => {
                                  if (e.target.value.trim() !== child.label) {
                                    void renameCategory(child.slug, e.target.value);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedChildFields((s) => ({
                                    ...s,
                                    [child.slug]: !childFieldsOpen,
                                  }))
                                }
                                className="text-xs font-semibold text-accent hover:underline"
                              >
                                {childFieldsOpen ? "Hide fields" : "Edit fields"}
                                {child.metadata && child.metadata.length > 0 ? ` (${child.metadata.length})` : ""}
                              </button>
                              <button
                                type="button"
                                onClick={() => void removeCategory(child.slug)}
                                className="text-xs font-semibold text-rose-600 hover:underline"
                              >
                                Delete subcategory
                              </button>
                            </div>
                            {intentModes[child.slug] ? (
                              <CategoryIntentModeControl
                                row={intentModes[child.slug]}
                                onSaved={(next) => setIntentModes((s) => ({ ...s, [next.slug]: next }))}
                              />
                            ) : null}
                            {childFieldsOpen ? (
                              <div className="pl-6">
                                <CategoryFieldsEditor
                                  slug={child.slug}
                                  ownJson={JSON.stringify(child.metadata ?? [])}
                                  parentJson={JSON.stringify(parentFieldsInUse(parent))}
                                  parentUnsaved={(parent.metadata ?? []).length === 0 && parentFieldsInUse(parent).length > 0}
                                  onSaved={() => void load()}
                                  scopeLabel="Fields from the parent category, plus fields only for this subcategory. Mark a parent field required here if this subcategory needs it."
                                />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                      <div className="flex items-center gap-2 pl-6">
                        <input
                          className="dm-input flex-1"
                          value={newChildLabel[parent.slug] ?? ""}
                          onChange={(e) =>
                            setNewChildLabel((s) => ({ ...s, [parent.slug]: e.target.value }))
                          }
                          placeholder="New subcategory name"
                          aria-label="New subcategory name"
                        />
                        <button
                          type="button"
                          onClick={() => void addChild(parent.slug)}
                          className="dm-btn dm-btn-ghost dm-btn-sm"
                        >
                          + Add subcategory
                        </button>
                      </div>
                    </div>

                    <CategoryFieldsEditor
                      slug={parent.slug}
                      ownJson={JSON.stringify(parent.metadata ?? [])}
                      defaultJson={JSON.stringify(categoryMetaFields(parent.label))}
                      onSaved={() => void load()}
                      scopeLabel="Fields for every subcategory in this category. Each subcategory can add its own fields or make these required."
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
