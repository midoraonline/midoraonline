"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import FormModal from "@/components/FormModal";
import { MaterialSymbol } from "@/components/MaterialSymbol";

export function signInHref(): string {
  const back = `${window.location.pathname}${window.location.search}`;
  return `/login?next=${encodeURIComponent(back === "/login" ? "/" : back)}`;
}

export default function SignInPrompt({
  action,
  onClose,
}: {
  action: string;
  onClose: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/login");
  }, [router]);

  return (
    <FormModal
      title="Sign in to continue"
      onClose={onClose}
      maxWidthClass="sm:max-w-sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="dm-btn dm-btn-ghost dm-btn-sm">
            Cancel
          </button>
          <button
            type="button"
            className="dm-btn dm-btn-primary"
            onClick={() => {
              router.push(signInHref());
              onClose();
            }}
          >
            Sign in
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
          <MaterialSymbol name="lock" className="!text-xl" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">You need an account to {action}.</p>
          <p className="text-sm text-muted">Sign in and we&apos;ll bring you straight back here.</p>
        </div>
      </div>
    </FormModal>
  );
}
