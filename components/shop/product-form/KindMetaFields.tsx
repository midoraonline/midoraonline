import { INPUT, TEXTAREA } from "@/components/post/StepFrame";
import {
  COMPENSATION_OPTIONS,
  CONDITION_OPTIONS,
  PRICING_MODEL_OPTIONS,
  type CategoryMetaField,
  type ListingMeta,
} from "@/lib/listingMeta";
import type { FormDraft, SetDraft } from "./types";

const OPTIONAL = <span className="font-normal text-muted">(optional)</span>;

type Setter = (patch: Partial<ListingMeta>) => void;

function MetaSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">{label}</label>
        <select className={INPUT} value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function MetaText({ label, value, placeholder, onChange }: { label: string; value?: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label} {OPTIONAL}
      </label>
      <input className={INPUT} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function OpportunityFields({ meta, set, has }: { meta: ListingMeta; set: Setter; has: (key: string) => boolean }) {
  return (
    <>
      {!has("deadline") ? (
        <div className="space-y-1.5">
          <label htmlFor="opportunity-deadline" className="block text-sm font-medium text-foreground">
            Application deadline {OPTIONAL}
          </label>
          <input
            id="opportunity-deadline"
            className={INPUT}
            type="date"
            value={meta.deadline ?? ""}
            onChange={(e) => set({ deadline: e.target.value || undefined })}
          />
        </div>
      ) : null}
      {!has("requirements") ? (
        <div className="space-y-1.5">
          <label htmlFor="opportunity-requirements" className="block text-sm font-medium text-foreground">
            Applicant requirements {OPTIONAL}
          </label>
          <textarea
            id="opportunity-requirements"
            className={TEXTAREA}
            rows={3}
            value={meta.requirements ?? ""}
            onChange={(e) => set({ requirements: e.target.value || undefined })}
            placeholder="Experience, qualifications, documents, or availability applicants need"
          />
        </div>
      ) : null}
    </>
  );
}

/** Built-in per-kind fields; a category field with the same key replaces the built-in input. */
export default function KindMetaFields({
  draft,
  setDraft,
  catFields,
}: {
  draft: FormDraft;
  setDraft: SetDraft;
  catFields: CategoryMetaField[];
}) {
  const { kind, meta } = draft;
  const has = (key: string) => catFields.some((f) => f.key === key);
  const set: Setter = (patch) => setDraft((d) => ({ ...d, meta: { ...d.meta, ...patch } }));
  const showOptional =
    kind === "product" ? !has("brand") : kind === "service" || !(has("deadline") && has("requirements"));
  return (
    <>
      {kind === "product" ? (
        <MetaSelect
          label="Condition"
          value={meta.condition}
          placeholder="Select condition…"
          options={CONDITION_OPTIONS}
          onChange={(v) => set({ condition: v as ListingMeta["condition"] })}
        />
      ) : null}
      {kind === "service" ? (
        <MetaSelect
          label="Pricing model"
          value={meta.pricing_model}
          placeholder="Select model…"
          options={PRICING_MODEL_OPTIONS}
          onChange={(v) => set({ pricing_model: v as ListingMeta["pricing_model"] })}
        />
      ) : null}
      {kind === "opportunity" ? (
        <MetaSelect
          label="Compensation"
          value={meta.compensation}
          placeholder="Select compensation…"
          options={COMPENSATION_OPTIONS}
          onChange={(v) => set({ compensation: v as ListingMeta["compensation"] })}
        />
      ) : null}
      {showOptional ? (
        <div className="space-y-4">
          {kind === "product" ? (
            <MetaText label="Brand" value={meta.brand} placeholder="e.g. Samsung, Nike" onChange={(brand) => set({ brand })} />
          ) : null}
          {kind === "service" ? (
            <>
              <MetaText
                label="Availability"
                value={meta.availability}
                placeholder="e.g. Mon–Sat 9am–6pm"
                onChange={(availability) => set({ availability })}
              />
              <MetaText
                label="Service area"
                value={meta.service_area}
                placeholder="e.g. Kampala & Wakiso"
                onChange={(service_area) => set({ service_area })}
              />
            </>
          ) : null}
          {kind === "opportunity" ? <OpportunityFields meta={meta} set={set} has={has} /> : null}
        </div>
      ) : null}
    </>
  );
}
