/** Shared geo types for Near me / Nominatim flows. */

export type LatLng = {
  lat: number;
  lng: number;
};

export type GeocodeHit = LatLng & {
  displayName: string;
};

export type UserGeo = LatLng & {
  /** Short label for chips, e.g. "Kampala" */
  label: string;
};

export type GeoPermissionErrorCode =
  | "unsupported"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unknown";

export class GeoLocationError extends Error {
  readonly code: GeoPermissionErrorCode;

  constructor(code: GeoPermissionErrorCode, message: string) {
    super(message);
    this.name = "GeoLocationError";
    this.code = code;
  }
}
