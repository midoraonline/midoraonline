import CategoryPicker from "@/components/CategoryPicker";
import FormSection, { FieldError, SectionHeading } from "./FormSection";
import type { SectionProps } from "./types";

export default function CategorySection({ draft, setDraft, showErrors, errors, invalid, serverMessage }: SectionProps) {
  return (
    <FormSection invalid={invalid} serverMessage={serverMessage}>
      <SectionHeading title="Category">
        {draft.kind === "product"
          ? "Assign a category so buyers can filter and discover your item."
          : "Category is set to Services based on your listing type. Pick a subcategory."}
      </SectionHeading>
      <div className="space-y-1.5">
        <CategoryPicker
          value={draft.category}
          onChange={(category) => setDraft((d) => ({ ...d, category }))}
          required
          idPrefix="product-category-page"
          lockedParentSlug={draft.kind === "service" ? "services" : undefined}
          excludeParentSlugs={draft.kind === "product" ? ["services", "opportunities"] : undefined}
        />
        <FieldError message={showErrors ? errors.category : null} />
      </div>
    </FormSection>
  );
}
