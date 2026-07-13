"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
};

export default function FormModal({
  title,
  onClose,
  children,
  footer,
  maxWidthClass = "sm:max-w-lg",
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
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
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-neutral-200 bg-white shadow-2xl ${maxWidthClass} sm:rounded-2xl`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="form-modal-title" className="text-base font-semibold text-neutral-900 sm:text-lg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-neutral-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const formFieldClass =
  "h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100";

export const formTextareaClass =
  "min-h-[88px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100";

export const formLabelClass = "text-xs font-semibold text-neutral-700";
