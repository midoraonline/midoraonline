import LocationInput from "@/components/LocationInput";
import ListingReachFields from "@/components/post/ListingReachFields";
import FormSection, { FieldError, SectionHeading } from "./FormSection";
import type { SectionProps } from "./types";

/** Location (required to publish) plus reach fields. */
export default function LocationSection({
  draft,
  setDraft,
  showErrors,
  errors,
  invalid,
  serverMessage,
  shopLocationLabel,
  verifyHref,
}: SectionProps & { shopLocationLabel: string; verifyHref: string }) {
  return (
    <FormSection invalid={invalid} serverMessage={serverMessage}>
      <SectionHeading title="Location">
        City or area, or Online if buyers do not visit a place. Country-only (e.g. Uganda) is not enough.
      </SectionHeading>
      <LocationInput
        value={draft.location_name}
        onlineValue="Online"
        onlineLabel="Online"
        onChange={(val) => setDraft((d) => ({ ...d, location_name: val }))}
        placeholder={shopLocationLabel || "e.g. Kisasi, Kampala"}
      />
      <FieldError message={showErrors ? errors.location_name : null} />
      <ListingReachFields kind={draft.kind} meta={draft.meta} onChange={(meta) => setDraft((d) => ({ ...d, meta }))} />
      {showErrors && errors.phone ? (
        <p className="text-xs text-[color:var(--error)]">
          {errors.phone}{" "}
          <a href={verifyHref} className="underline">
            Verify now
          </a>
        </p>
      ) : null}
    </FormSection>
  );
}
