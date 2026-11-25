import { MediaDropzone } from "@/components/shop/MediaDropzone";
import FormSection, { FieldError, SectionAlert, SectionHeading } from "./FormSection";
import type { SectionProps } from "./types";

const PLAN_NAMES: Record<string, string> = { basic: "Basic", standard: "Standard", premium: "Premium" };

type Props = SectionProps & {
  maxPhotos: number;
  maxVideos: number;
  planTier: string;
  mediaError: string | null;
};

function mediaCopy(kind: SectionProps["draft"]["kind"], maxPhotos: number, maxVideos: number) {
  const video = maxVideos ? " or a short video" : "";
  if (kind === "opportunity") {
    return { title: "Media (optional)", hint: `Photos are optional. You can still add up to ${maxPhotos} photos${video}.` };
  }
  if (kind === "service") {
    return {
      title: "Photos and video (optional)",
      hint: `Photos are optional for services. Add up to ${maxPhotos} if they help clients trust your work. The first photo is the cover; drag to reorder.`,
    };
  }
  return {
    title: "Photos and video",
    hint: `Add up to ${maxPhotos} photos${video}. At least 2 photos are required to publish. The first photo is the cover; drag to reorder.`,
  };
}

export default function MediaSection(props: Props) {
  const { draft, setDraft, showErrors, errors, invalid, serverMessage, onEdited, maxPhotos, maxVideos } = props;
  const copy = mediaCopy(draft.kind, maxPhotos, maxVideos);
  const append = (url: string) => setDraft((d) => ({ ...d, image_urls: [...d.image_urls, url] }));
  return (
    <FormSection invalid={invalid}>
      <SectionHeading title={copy.title}>{copy.hint}</SectionHeading>
      <MediaDropzone
        photosRequired={draft.kind === "product"}
        urls={draft.image_urls}
        maxPhotos={maxPhotos}
        maxVideos={maxVideos}
        planName={PLAN_NAMES[props.planTier] ?? "Basic"}
        upgradeHref="/merchant/billing"
        invalid={invalid}
        onRemove={(index) => {
          onEdited();
          setDraft((d) => ({ ...d, image_urls: d.image_urls.filter((_, i) => i !== index) }));
        }}
        onReorder={(from, to) => {
          setDraft((d) => {
            const next = [...d.image_urls];
            const [picked] = next.splice(from, 1);
            next.splice(to, 0, picked);
            return { ...d, image_urls: next };
          });
        }}
        onReplace={(index, url) => {
          setDraft((d) => ({ ...d, image_urls: d.image_urls.map((u, i) => (i === index ? url : u)) }));
        }}
        onImageUploaded={(url) => {
          onEdited();
          append(url);
        }}
        onVideoUploaded={append}
      />
      <SectionAlert message={serverMessage} />
      <FieldError message={showErrors ? errors.images : null} />
      {props.mediaError ? (
        <p className="text-xs text-[color:var(--error)]" role="alert">
          {props.mediaError}
        </p>
      ) : null}
    </FormSection>
  );
}
