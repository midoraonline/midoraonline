import TitleField from "@/components/post/TitleField";
import { INPUT, TEXTAREA } from "@/components/post/StepFrame";
import FormSection, { FieldError, SectionHeading } from "./FormSection";
import type { FormDraft, SectionProps } from "./types";

const TITLE_PLACEHOLDER: Record<FormDraft["kind"], string> = {
  opportunity: "e.g. Shop assistant needed in Kampala",
  service: "e.g. Home cleaning, same day in Kampala",
  product: "What are you selling?",
};

const DESCRIPTION_PROMPT: Record<FormDraft["kind"], string> = {
  service:
    "Explain what the service includes, who it is for, and what customers can expect. Pricing model, availability, and service area are collected separately.",
  opportunity:
    "Describe the role or offer, who can apply, responsibilities, requirements, location, and how to respond. Add compensation and deadline below when relevant.",
  product: "Describe the item, its condition, what is included, location, and any requirements.",
};

/** Title and description. */
export default function DetailsSection({
  draft,
  setDraft,
  showErrors,
  errors,
  invalid,
  serverMessage,
  onEdited,
  titleError,
}: SectionProps & { titleError?: string }) {
  const prompt = DESCRIPTION_PROMPT[draft.kind];
  return (
    <FormSection invalid={invalid} serverMessage={serverMessage} className="space-y-5">
      <SectionHeading title="Details">A clear title and a few honest sentences help buyers decide.</SectionHeading>
      <TitleField
        value={draft.title}
        onChange={(title) => {
          onEdited();
          setDraft((d) => ({ ...d, title }));
        }}
        placeholder={TITLE_PLACEHOLDER[draft.kind]}
        error={showErrors ? (errors.title ?? titleError) : null}
        inputClassName={INPUT}
        required
      />
      <div className="space-y-1.5">
        <label htmlFor="product-description" className="block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="product-description"
          className={TEXTAREA}
          rows={5}
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder={prompt}
          aria-invalid={showErrors && Boolean(errors.description)}
        />
        <p className="text-xs text-muted">{`${prompt} Write at least two clear sentences.`}</p>
        <FieldError message={showErrors ? errors.description : null} />
      </div>
    </FormSection>
  );
}
