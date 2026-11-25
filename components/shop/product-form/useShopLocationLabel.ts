import { useEffect, useState } from "react";
import { apiShops } from "@/lib/api";

/** Shop's display location, used as the listing location fallback. */
export function useShopLocationLabel(shopId?: string) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    apiShops
      .getShop(shopId)
      .then((shop) => {
        if (cancelled || !shop) return;
        const loc = shop.location;
        const next =
          typeof loc === "string"
            ? loc
            : loc && typeof loc === "object"
              ? String((loc as { display?: string; city?: string }).display || (loc as { city?: string }).city || "")
              : "";
        setLabel(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [shopId]);
  return label;
}
