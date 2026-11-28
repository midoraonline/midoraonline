import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const BACK = "inline-flex h-9 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground";

/** Back link (or step Back button), page title, and moderation note. */
export default function FormHeader({
  title,
  backUrl,
  onBack,
  flush,
}: {
  title: string;
  backUrl: string;
  onBack?: () => void;
  flush: boolean;
}) {
  return (
    <div>
      <div className="space-y-1">
        {onBack ? (
          <button type="button" onClick={onBack} className={BACK}>
            <ArrowLeft className="size-3.5" />
            Back
          </button>
        ) : (
          <Link href={backUrl} className={BACK}>
            <ArrowLeft className="size-3.5" />
            Back to listings
          </Link>
        )}
        {flush ? null : <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>}
        <p className="text-sm text-muted">We check listings before they go live. This usually takes under a minute.</p>
      </div>
    </div>
  );
}
