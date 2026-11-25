import ApplicationLinkField from "@/components/post/ApplicationLinkField";
import { INPUT } from "@/components/post/StepFrame";
import CategoryMetaInputs from "@/components/shop/CategoryMetaInputs";
import { applicationLinkRecommended, showsApplicationLink } from "@/lib/listingIntentForm";
import { LISTING_KIND_LABEL, type CategoryMetaField, type ListingMeta } from "@/lib/listingMeta";
import FormSection, { FieldError, SectionHeading } from "./FormSection";
import KindMetaFields from "./KindMetaFields";
import type { SectionProps } from "./types";

type Props = SectionProps & {
  catFields: CategoryMetaField[];
  parentLabel: string | null;
  applicationLinkError?: string;
  linkServerError: string | null;
  setLinkServerError: (value: string | null) => void;
  serverFieldErrors: Record<string, string>;
  setServerFieldErrors: (update: (current: Record<string, string>) => Record<string, string>) => void;
};

/** Kind and category-specific fields, plus the application link. */
export default function MoreDetailsSection(props: Props) {
  const { draft, setDraft, showErrors, errors, catFields, linkServerError, setLinkServerError, serverFieldErrors } = props;
  const fieldErrors = linkServerError
    ? { ...serverFieldErrors, application_link: linkServerError }
    : showErrors
      ? serverFieldErrors
      : undefined;
  return (
    <FormSection invalid={props.invalid} serverMessage={props.serverMessage}>
      <SectionHeading title="More about this listing">
        Details that help buyers compare this {LISTING_KIND_LABEL[draft.kind].toLowerCase()}
        {props.parentLabel ? ` · ${props.parentLabel}` : ""}
      </SectionHeading>
      <KindMetaFields draft={draft} setDraft={setDraft} catFields={catFields} />
      {showsApplicationLink(draft.kind) && !catFields.some((f) => f.key === "application_link") ? (
        <ApplicationLinkField
          value={draft.meta.application_link ?? ""}
          onChange={(application_link) => {
            setLinkServerError(null);
            setDraft((d) => ({ ...d, meta: { ...d.meta, application_link } }));
          }}
          error={linkServerError ?? (showErrors ? props.applicationLinkError : null)}
          inputClassName={INPUT}
          recommended={applicationLinkRecommended(draft.kind, draft.meta, draft.category)}
        />
      ) : null}
      {catFields.length > 0 ? (
        <CategoryMetaInputs
          fields={catFields}
          meta={draft.meta}
          fieldErrors={fieldErrors}
          onChange={(key, value) => {
            if (key === "application_link") setLinkServerError(null);
            props.setServerFieldErrors((current) => {
              if (!current[key]) return current;
              const next = { ...current };
              delete next[key];
              return next;
            });
            setDraft((d) => ({ ...d, meta: { ...d.meta, [key]: value } as ListingMeta }));
          }}
        />
      ) : null}
      <FieldError message={showErrors ? errors.meta : null} />
    </FormSection>
  );
}
