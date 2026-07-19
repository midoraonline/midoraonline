"use client";

import { Toaster } from "sonner";

/**
 * Global toast host — mounted once in the root layout.
 * All notification styling is driven by design tokens in app/globals.css
 * (see `.dm-toast-*` classes). Do not pass per-toast styles at call sites.
 */
export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors={false}
      closeButton
      duration={4000}
      offset={16}
      gap={8}
      visibleToasts={3}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "dm-toast",
          title: "dm-toast-title",
          description: "dm-toast-description",
          actionButton: "dm-toast-action",
          cancelButton: "dm-toast-cancel",
          closeButton: "dm-toast-close",
          success: "dm-toast-success",
          error: "dm-toast-error",
          warning: "dm-toast-warning",
          info: "dm-toast-info",
          loading: "dm-toast-loading",
        },
      }}
    />
  );
}
