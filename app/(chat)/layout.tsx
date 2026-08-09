import type { Metadata } from "next";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Messages | Midora Online",
  description: "Chat with buyers and sellers on Midora Online.",
};

/**
 * Dedicated messaging shell — no rent banner, footer, or info widget, and no
 * bottom nav. The composer needs every pixel above the on-screen keyboard, so
 * we hand navigation back to the header. `100dvh` shrinks on Android
 * (`interactive-widget=resizes-content`); iOS Safari doesn't shrink dvh, so
 * ChatThread supplements it via `useKeyboardInset`.
 */
export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <Navbar />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
