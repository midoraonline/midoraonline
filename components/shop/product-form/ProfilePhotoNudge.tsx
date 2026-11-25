import { useState } from "react";
import { BTN_SECONDARY, BTN_TEXT } from "@/components/dashboard/ui";

/** Soft profile-photo nudge (Phase 1 Should) on a first listing. */
export default function ProfilePhotoNudge({ href }: { href: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 text-sm">
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-foreground/85">
        Add a profile photo so buyers know who they&apos;re messaging. It builds trust — you can skip for now.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <a href={href} className={BTN_SECONDARY}>
          Add photo
        </a>
        <button type="button" onClick={() => setDismissed(true)} className={BTN_TEXT}>
          Not now
        </button>
      </div>
    </div>
  );
}
