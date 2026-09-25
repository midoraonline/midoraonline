/** "Online" and the older "Online Shop" label are the same non-physical place. */
export function isOnlineLocation(value: string | null | undefined): boolean {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[,.\s]+|[,.\s]+$/g, "");
  return normalized === "online" || normalized === "online shop";
}

/**
 * Publish body for a listing place.
 * Online sends location_name "Online" and is_online true, and never lat/lng.
 */
export function listingLocationPayload(locationName: string): {
  location_name?: string;
  is_online: boolean;
} {
  if (isOnlineLocation(locationName)) {
    return { location_name: "Online", is_online: true };
  }
  const trimmed = locationName.trim();
  return {
    location_name: trimmed || undefined,
    is_online: false,
  };
}

/** Draft place, falling back to the shop label only when that label is Online. */
export function listingPlaceFields(
  locationName: string,
  shopLocationLabel: string,
): { location_name?: string; is_online: boolean } {
  const typed = locationName.trim();
  const effective = typed || shopLocationLabel.trim();
  if (isOnlineLocation(effective)) {
    return { location_name: "Online", is_online: true };
  }
  return listingLocationPayload(typed);
}
