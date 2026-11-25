"use client";

import useSWR from "swr";
import { fetchIntentModes } from "@/lib/api/categories";
import { currentIntentModes, overridesFromRows, setIntentModes } from "@/lib/intentModes";
import type { IntentModeOverrides } from "@/lib/listingIntent";

async function loadIntentModes(): Promise<IntentModeOverrides> {
  try {
    const modes = overridesFromRows(await fetchIntentModes());
    setIntentModes(modes);
    return modes;
  } catch {
    return currentIntentModes();
  }
}

/** Effective Offer/Seek overrides for the posting form; `{}` (code defaults) until loaded. */
export function useIntentModes(): IntentModeOverrides {
  const { data } = useSWR("categories:intent-modes", loadIntentModes, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  return data ?? currentIntentModes();
}
