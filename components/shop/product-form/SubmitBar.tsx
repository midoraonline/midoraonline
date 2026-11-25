import { BTN_GHOST, BTN_PRIMARY } from "@/components/dashboard/ui";

/** Sticky action bar: above the mobile BottomNav when present, else hugging the viewport. */
export default function SubmitBar({
  mode,
  hasBottomNav,
  saving,
  aiChecking,
  isDirty,
  critical,
  onCancel,
}: {
  mode: "add" | "edit";
  hasBottomNav: boolean;
  saving: boolean;
  aiChecking: boolean;
  isDirty: boolean;
  critical: boolean;
  onCancel: () => void;
}) {
  const label = saving
    ? "Saving…"
    : aiChecking
      ? "Running AI review…"
      : mode === "add"
        ? "Publish listing"
        : "Save changes";
  return (
    <div
      className={`fixed inset-x-0 z-modal border-t border-border bg-surface/95 py-3 backdrop-blur ${
        hasBottomNav
          ? "bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:bottom-0"
          : "bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-row-reverse items-center gap-2 px-4 sm:px-6 lg:px-8">
        <button
          type="submit"
          form="product-form-page"
          disabled={saving || aiChecking || !isDirty || critical}
          title={
            !isDirty ? "No changes to save." : critical ? "The AI review found problems. Edit the listing first." : undefined
          }
          className={`${BTN_PRIMARY} min-w-36`}
        >
          {label}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className={`${BTN_GHOST} mr-auto`}>
          Cancel
        </button>
      </div>
    </div>
  );
}
