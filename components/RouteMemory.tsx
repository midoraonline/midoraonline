"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { recordRoute } from "@/lib/returnTo";

function RouteMemoryInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    const qs = search?.toString();
    recordRoute(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, search]);
  return null;
}

export default RouteMemoryInner;
