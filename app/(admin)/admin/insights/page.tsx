import type { Metadata } from "next";

import InsightsClient from "./InsightsClient";

export const metadata: Metadata = {
  title: "Insights · Midora Admin",
  description:
    "Behavioral insights derived from analytics_events: discovery liquidity, conversion funnels, trust health, verification drop-off.",
};

export const dynamic = "force-dynamic";

export default function AdminInsightsPage() {
  // Client-only: each panel loads its own endpoint concurrently and manages
  // its own error state. Keeping this a Server Component with big awaits
  // would delay first paint on cold FastAPI containers.
  return <InsightsClient />;
}
