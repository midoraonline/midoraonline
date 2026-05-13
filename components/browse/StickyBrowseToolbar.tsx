import type { ReactNode } from "react";

/**
 * `top` matches the fixed navbar stack (see `main` padding in app layouts).
 * Keeps browse search + category rail pinned while the page scrolls.
 */
const stickyShell =
  "sticky z-30 top-[5.25rem] sm:top-[5.75rem] border-b border-foreground/[0.08] bg-background/90 py-2 pb-3 backdrop-blur-xl backdrop-saturate-150";

export default function StickyBrowseToolbar({ children }: { children: ReactNode }) {
  return <div className={stickyShell}>{children}</div>;
}

/** Same vertical offset as the toolbar, for the category column. */
export const browseCategoryStickyClass =
  "sticky z-20 self-start top-[5.25rem] sm:top-[5.75rem]";
