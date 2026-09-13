"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiAdmin } from "@/lib/api";
import type { AdminCategory } from "@/lib/api/admin";
import { CATEGORY_META_FIELD_KEY_OPTIONS, type CategoryMetaField } from "@/lib/listingMeta";

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function optionsToText(options?: readonly { value: string; label: string }[]): string {
  return (options ?? []).map((o) => `${o.value}|${o.label}`).join("\n");
}

function textToOptions(text: string): { value: string; label: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, label] = line.split("|").map((s) => s.trim());
      return { value: value || "", label: label || value || "" };
    })
    .filter((o) => o.value);
}

function emptyField(): CategoryMetaField {
  return { key: "brand", label: "Brand", kind: "text" };
}

function FieldsEditor({
  slug,
  initial,
  onSaved,
  scopeLabel,
}: {
  slug: string;
  initial: CategoryMetaField[];
  onSaved: () => void;
  scopeLabel: string;
}) {
  const [fields, setFields] = useState<CategoryMetaField[]>(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(fields) !== JSON.stringify(initial);

  useEffect(() => setFields(initial), [initial]);

  function update(i: number, patch: Partial<CategoryMetaField>) {
    setFields((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function save() {
    setSaving(true);
    try {
      await apiAdmin.adminUpdateCategory(slug, { metadata: fields });
      toast.success("Fields saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save fields");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-surface-subtle/40 p-3">
      <p className="text-xs text-muted">
        Extra fields shown on the post-item form for {scopeLabel}.
      </p>
      {fields.length === 0 ? (
        <p className="text-xs text-muted italic">No extra fields configured.</p>
      ) : (
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-border/50 p-2 sm:grid-cols-6">
              <input
                className="dm-input sm:col-span-1"
                value={f.key}
                onChange={(e) => update(i, { key: e.target.value })}
                list="category-meta-field-keys"
                placeholder="Field key (e.g. brand)"
              />
              <input
                className="dm-input sm:col-span-1"
                value={f.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Field label"
              />
              <select
                className="dm-input sm:col-span-1"
                value={f.kind}
                onChange={(e) => update(i, { kind: e.target.value as CategoryMetaField["kind"] })}
              >
                <option value="text">Text</option>
                <option value="select">Select</option>
              </select>
              {f.kind === "text" ? (
                <input
                  className="dm-input sm:col-span-2"
                  value={f.placeholder ?? ""}
                  onChange={(e) => update(i, { placeholder: e.target.value })}
                  placeholder="Placeholder"
                />
              ) : (
                <textarea
                  className="dm-input sm:col-span-2"
                  rows={2}
                  value={optionsToText(f.options)}
                  onChange={(e) => update(i, { options: textToOptions(e.target.value) })}
                  placeholder={"value|Label\none per line"}
                />
              )}
              <div className="flex items-center gap-2 sm:col-span-1">
                <label className="flex items-center gap-1.5 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(f.required)}
                    onChange={(e) => update(i, { required: e.target.checked })}
                  />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => setFields((rows) => rows.filter((_, idx) => idx !== i))}
                  className="ml-auto text-xs font-semibold text-rose-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFields((rows) => [...rows, emptyField()])}
          className="dm-btn dm-btn-ghost dm-btn-sm"
        >
          + Add field
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="dm-btn dm-btn-primary dm-btn-sm ml-auto disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save fields"}
        </button>
      </div>
    </div>
  );
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
      setCategories(rows);
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
                              <FieldsEditor
                                slug={child.slug}
                                initial={child.metadata ?? []}
                                onSaved={load}
                                scopeLabel="this subcategory only (overrides the category field with the same key)"
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

                  <FieldsEditor
                    slug={parent.slug}
                    initial={parent.metadata ?? []}
                    onSaved={load}
                    scopeLabel="every subcategory under this category (unless a subcategory overrides a field below)"
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
