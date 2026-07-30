import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Messages | Midora Online",
  description: "Chat with buyers and sellers on Midora Online.",
};

/**
 * Dedicated messaging shell — no rent banner, footer, or info widget.
 * Keeps mobile BottomNav; chat body pads above it so the composer stays clear.
 */
export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <Navbar />
      <div className="flex min-h-0 flex-1 flex-col pb-24 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
