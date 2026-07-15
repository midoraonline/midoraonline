"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
};

let openModalCount = 0;

function lockBodyScroll() {
  openModalCount += 1;
  document.documentElement.classList.add("modal-open");
}

function unlockBodyScroll() {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.documentElement.classList.remove("modal-open");
  }
}

/**
 * Bottom-sheet on mobile, centered card on desktop.
 * Always portaled to document.body at --z-modal so floating chat FABs
 * (--z-fab) and sticky nav (--z-sticky) cannot cover Save / actions.
 */
export default function FormModal({
  title,
  onClose,
  children,
  footer,
  maxWidthClass = "sm:max-w-lg",
}: Props) {
  useEffect(() => {
    lockBodyScroll();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="z-modal fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={`relative flex w-full max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom,0px)))] flex-col overflow-hidden rounded-t-2xl border border-neutral-200 bg-white shadow-2xl sm:max-h-[min(90dvh,720px)] sm:rounded-2xl ${maxWidthClass}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3 sm:px-6 sm:py-4">
          <h2
            id="form-modal-title"
            className="pr-2 text-base font-semibold text-neutral-900 sm:text-lg"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-5">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-neutral-100 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export const formFieldClass =
  "h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100";

export const formTextareaClass =
  "min-h-[88px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100";

export const formLabelClass = "text-xs font-semibold text-neutral-700";
