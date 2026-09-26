"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiAdmin } from "@/lib/api";
import {
  normalizeCategoryFields,
  type CategoryMetaField,
  type CategoryMetaFieldKind,
} from "@/lib/listingMeta";

const KINDS: { value: CategoryMetaFieldKind; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
];

type EditorField = CategoryMetaField & { inherited?: boolean };

function optionsToText(options?: readonly { value: string; label: string }[]): string {
  return (options ?? []).map((o) => `${o.value}|${o.label}`).join("\n");
}

function textToOptions(text: string): { value: string; label: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, label] = line.split("|").map((part) => part.trim());
      return { value: value || "", label: label || value || "" };
    })
    .filter((option) => option.value);
}

function emptyField(): EditorField {
  return { key: "", label: "", kind: "text" };
}

function toEditorRows(parent: CategoryMetaField[], own: CategoryMetaField[]): EditorField[] {
  const ownByKey = new Map(own.map((field) => [field.key, field]));
  const rows: EditorField[] = parent.map((field) => {
    const over = ownByKey.get(field.key);
    return {
      ...field,
      required: over?.required ?? field.required,
      help: over?.help ?? field.help,
      inherited: true,
    };
  });
  for (const field of own) {
    if (parent.some((row) => row.key === field.key)) continue;
    rows.push({ ...field, inherited: false });
  }
  return rows;
}

function serialize(field: EditorField): CategoryMetaField {
  const out: CategoryMetaField = {
    key: field.key.trim(),
    label: field.label.trim(),
    kind: field.kind,
    required: Boolean(field.required),
  };
  if (field.placeholder?.trim()) out.placeholder = field.placeholder.trim();
  if (field.help?.trim()) out.help = field.help.trim();
  if (field.kind === "select" && field.options?.length) out.options = field.options;
  return out;
}

export default function CategoryFieldsEditor({
  slug,
  scopeLabel,
  ownJson,
  parentJson = "[]",
  onSaved,
}: {
  slug: string;
  scopeLabel: string;
  ownJson: string;
  parentJson?: string;
  onSaved: () => void;
}) {
  const parentFields = useMemo(
    () => normalizeCategoryFields(JSON.parse(parentJson) as unknown),
    [parentJson],
  );
  const ownFields = useMemo(
    () => normalizeCategoryFields(JSON.parse(ownJson) as unknown),
    [ownJson],
  );
  const baseline = useMemo(
    () => toEditorRows(parentFields, ownFields),
    [parentFields, ownFields],
  );
  const [fields, setFields] = useState<EditorField[]>(baseline);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFields(baseline);
  }, [baseline]);

  const dirty = JSON.stringify(fields) !== JSON.stringify(baseline);

  function update(index: number, patch: Partial<EditorField>) {
    setFields((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function move(index: number, delta: number) {
    setFields((rows) => {
      const next = index + delta;
      if (next < 0 || next >= rows.length) return rows;
      if (rows[index]?.inherited || rows[next]?.inherited) return rows;
      const copy = rows.slice();
      const [row] = copy.splice(index, 1);
      copy.splice(next, 0, row);
      return copy;
    });
  }

  function payload(): CategoryMetaField[] {
    const saved: CategoryMetaField[] = [];
    for (const field of fields) {
      if (field.inherited) {
        const base = parentFields.find((row) => row.key === field.key);
        if (!base) continue;
        const requiredChanged = Boolean(field.required) !== Boolean(base.required);
        const helpChanged = (field.help ?? "") !== (base.help ?? "");
        if (requiredChanged || helpChanged) {
          saved.push(serialize({ ...base, required: field.required, help: field.help }));
        }
        continue;
      }
      if (!field.key.trim() || !field.label.trim()) continue;
      saved.push(serialize(field));
    }
    return saved;
  }

  async function save() {
    setSaving(true);
    try {
      await apiAdmin.adminUpdateCategory(slug, { metadata: payload() });
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
      <p className="text-xs text-muted">{scopeLabel}</p>
      {fields.length === 0 ? (
        <p className="text-xs italic text-muted">No extra fields configured.</p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={`${field.inherited ? "in" : "own"}-${field.key || index}`} className="space-y-2 rounded-lg border border-border/50 p-2">
              <div className="grid gap-2 sm:grid-cols-6">
                <input
                  className="dm-input sm:col-span-1"
                  value={field.key}
                  disabled={field.inherited}
                  onChange={(e) => update(index, { key: e.target.value })}
                  list="category-meta-field-keys"
                  placeholder="Field key"
                  aria-label="Field key"
                />
                <input
                  className="dm-input sm:col-span-2"
                  value={field.label}
                  disabled={field.inherited}
                  onChange={(e) => update(index, { label: e.target.value })}
                  placeholder="Label"
                  aria-label="Field label"
                />
                <select
                  className="dm-input sm:col-span-1"
                  value={field.kind}
                  disabled={field.inherited}
                  onChange={(e) => update(index, { kind: e.target.value as CategoryMetaFieldKind })}
                  aria-label="Field type"
                >
                  {KINDS.map((kind) => (
                    <option key={kind.value} value={kind.value}>
                      {kind.label}
                    </option>
                  ))}
                </select>
                <input
                  className="dm-input sm:col-span-2"
                  value={field.help ?? ""}
                  onChange={(e) => update(index, { help: e.target.value })}
                  placeholder="Help text"
                  aria-label="Help text"
                />
              </div>
              {field.kind === "select" && !field.inherited ? (
                <textarea
                  className="dm-input"
                  rows={2}
                  value={optionsToText(field.options)}
                  onChange={(e) => update(index, { options: textToOptions(e.target.value) })}
                  placeholder={"value|Label\none per line"}
                  aria-label="Select options"
                />
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                {field.inherited ? (
                  <span className="text-[11px] font-medium text-muted">From category</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <button type="button" className="dm-btn dm-btn-ghost dm-btn-sm" onClick={() => move(index, -1)} aria-label="Move field up">
                      Up
                    </button>
                    <button type="button" className="dm-btn dm-btn-ghost dm-btn-sm" onClick={() => move(index, 1)} aria-label="Move field down">
                      Down
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-1.5 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(field.required)}
                    onChange={(e) => update(index, { required: e.target.checked })}
                  />
                  Required
                </label>
                {field.inherited ? null : (
                  <button
                    type="button"
                    onClick={() => setFields((rows) => rows.filter((_, i) => i !== index))}
                    className="ml-auto text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
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
