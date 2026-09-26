"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiAdmin } from "@/lib/api";
import type { AdminCategory } from "@/lib/api/admin";
import CategoryFieldsEditor from "@/components/admin/CategoryFieldsEditor";
import { CATEGORY_META_FIELD_KEY_OPTIONS, normalizeCategoryFields } from "@/lib/listingMeta";

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await apiAdmin.adminListCategories();
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
      setError(err instanceof Error ? err.message : "Failed to load categories");
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
      toast.success("Category added");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add category");
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
      toast.success("Subcategory added");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add subcategory");
    }
  }

  async function removeCategory(slug: string) {
    if (!window.confirm("Delete this category?")) return;
    try {
      await apiAdmin.adminDeleteCategory(slug);
      toast.success("Deleted");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function renameCategory(slug: string, label: string) {
    if (!label.trim()) return;
    try {
      await apiAdmin.adminUpdateCategory(slug, { label: label.trim() });
      toast.success("Saved");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading categories…</p>;
  }

    return (
    <>
      <datalist id="category-meta-field-keys">
        {CATEGORY_META_FIELD_KEY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} />
        ))}
      </datalist>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Categories
          </h2>
          <p className="mt-1 text-sm text-muted">
            Manage the categories, subcategories, and extra listing fields buyers and sellers see across Midora.
          </p>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">{error}</p>
        ) : null}

        <div className="dm-card flex flex-wrap items-center gap-2 p-4">
          <input
            className="dm-input flex-1 min-w-[200px]"
            value={newParentLabel}
            onChange={(e) => setNewParentLabel(e.target.value)}
            placeholder="New top-level category name"
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
              <div key={parent.slug} className="dm-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExpanded((s) => ({ ...s, [parent.slug]: !isOpen }))}
                    className="text-xs font-semibold text-muted hover:text-foreground"
                  >
                    {isOpen ? "▾" : "▸"}
                  </button>
                  <input
                    className="dm-input flex-1 min-w-[160px] font-semibold"
                    defaultValue={parent.label}
                    key={parent.label}
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
                    title={children.length > 0 ? "Remove subcategories first" : undefined}
                    className="text-xs font-semibold text-rose-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete
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
                                {childFieldsOpen ? "Hide fields" : "Fields"}
                                {child.metadata && child.metadata.length > 0 ? ` (${child.metadata.length})` : ""}
                              </button>
                              <button
                                type="button"
                                onClick={() => void removeCategory(child.slug)}
                                className="text-xs font-semibold text-rose-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                            {childFieldsOpen ? (
                              <div className="pl-6">
                                <CategoryFieldsEditor
                                  slug={child.slug}
                                  ownJson={JSON.stringify(child.metadata ?? [])}
                                  parentJson={JSON.stringify(parent.metadata ?? [])}
                                  onSaved={() => void load()}
                                  scopeLabel="Inherited category fields, plus fields that apply only to this subcategory. Mark an inherited field required here when this subcategory needs it."
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
                        />
                        <button
                          type="button"
                          onClick={() => void addChild(parent.slug)}
                          className="dm-btn dm-btn-ghost dm-btn-sm"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    <CategoryFieldsEditor
                      slug={parent.slug}
                      ownJson={JSON.stringify(parent.metadata ?? [])}
                      onSaved={() => void load()}
                      scopeLabel="Fields for every subcategory under this category. A subcategory can add its own fields or mark these required."
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
