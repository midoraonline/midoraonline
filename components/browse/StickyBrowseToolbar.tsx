import type { ReactNode } from "react";

const stickyShell =
  "sticky z-30 top-[5.125rem] sm:top-[5.625rem] border-b border-foreground/[0.08] bg-background/90 pt-1 pb-1.5 backdrop-blur-xl backdrop-saturate-150";

export default function StickyBrowseToolbar({ children }: { children: ReactNode }) {
  return <div className={stickyShell}>{children}</div>;
}

export const browseCategoryStickyClass =
  "sticky z-20 self-start top-[5.125rem] sm:top-[5.625rem]";
