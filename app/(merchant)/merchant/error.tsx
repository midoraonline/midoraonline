"use client";

import { PageError } from "@/components/dashboard/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError reset={reset} backHref="/merchant" backLabel="Overview" />;
}
