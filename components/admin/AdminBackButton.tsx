"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BTN_SECONDARY } from "@/components/dashboard/ui";

/** Goes back when there is in-app history, else to the fallback page. */
export default function AdminBackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  };
  return (
    <button type="button" onClick={goBack} className={BTN_SECONDARY}>
      <ArrowLeft className="size-4" aria-hidden /> Back
    </button>
  );
}
