import ListingIntentFields from "@/components/post/ListingIntentFields";
import FormSection, { SectionHeading } from "./FormSection";
import type { SectionProps } from "./types";

/** Offer/need (services) or opportunity type. Products have no intent. */
export default function IntentSection({
  draft,
  setDraft,
  showErrors,
  errors,
  invalid,
  serverMessage,
  onEdited,
  intentError,
}: SectionProps & { intentError?: string }) {
  if (draft.kind === "product") return null;
  return (
    <FormSection invalid={invalid} serverMessage={serverMessage}>
      <SectionHeading title={draft.kind === "service" ? "Offer or need" : "Type of opportunity"}>
        {draft.kind === "service"
          ? "We show this on your listing so buyers know straight away."
          : "Pick the closest match. It sets the label on your listing and the button buyers tap."}
      </SectionHeading>
      <ListingIntentFields
        kind={draft.kind}
        meta={draft.meta}
        category={draft.category}
        showErrors={showErrors}
        error={intentError ?? (draft.kind === "opportunity" ? errors.category : null)}
        onChange={({ meta, category }) => {
          onEdited();
          setDraft((d) => ({ ...d, meta, category: category ?? d.category }));
        }}
      />
    </FormSection>
  );
}
