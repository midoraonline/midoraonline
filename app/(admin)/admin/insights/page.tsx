import type { Metadata } from "next";

import InsightsClient from "./InsightsClient";

export const metadata: Metadata = {
  title: "Insights · Midora Admin",
  description:
    "How buyers find listings and contact sellers, where verification stalls, and trust signals.",
};

export const dynamic = "force-dynamic";

export default function AdminInsightsPage() {
  // Client-only: each panel loads its own endpoint concurrently and manages
  // its own error state. Keeping this a Server Component with big awaits
  // would delay first paint on cold FastAPI containers.
  return <InsightsClient />;
}
