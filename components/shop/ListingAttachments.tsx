import { attachmentsInMeta, downloadLabel } from "@/lib/listingAttachment";

/** Download links for category file fields stored in listing_meta. */
export default function ListingAttachments({ meta }: { meta: Record<string, unknown> | null | undefined }) {
  const files = attachmentsInMeta(meta);
  if (files.length === 0) return null;
  return (
    <section className="space-y-2 border-t border-border pt-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
        {files.length === 1 ? "Attachment" : "Attachments"}
      </h2>
      <ul className="space-y-2">
        {files.map(({ key, file }) => (
          <li key={key}>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="dm-focus inline-flex min-h-11 items-center rounded-lg bg-surface-subtle px-3 py-2 text-sm font-medium text-foreground underline-offset-2 hover:underline"
            >
              {downloadLabel(file)}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
