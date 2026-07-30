import { GeoLocationError, type LatLng } from "./types";

const DEFAULT_OPTS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 12_000,
  maximumAge: 5 * 60_000,
};

/**
 * Request the device GPS / network location via the browser Geolocation API.
 * Only call from a user gesture (e.g. "Near me" click) — never on page load.
 */
export function getBrowserLocation(
  options: PositionOptions = DEFAULT_OPTS,
): Promise<LatLng> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.reject(
      new GeoLocationError(
        "unsupported",
        "Location is not supported in this browser.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(
              new GeoLocationError(
                "denied",
                "Location permission denied. Enable it in browser settings, or pick a place from the list.",
              ),
            );
            break;
          case err.POSITION_UNAVAILABLE:
            reject(
              new GeoLocationError(
                "unavailable",
                "Couldn’t determine your location. Try again or pick a place from the list.",
              ),
            );
            break;
          case err.TIMEOUT:
            reject(
              new GeoLocationError(
                "timeout",
                "Location request timed out. Try again or pick a place from the list.",
              ),
            );
            break;
          default:
            reject(
              new GeoLocationError(
                "unknown",
                "Something went wrong getting your location.",
              ),
            );
        }
      },
      options,
    );
  });
}
