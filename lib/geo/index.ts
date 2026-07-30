export type { LatLng, GeocodeHit, UserGeo, GeoPermissionErrorCode } from "./types";
export { GeoLocationError } from "./types";
export { haversineKm } from "./haversine";
export { getBrowserLocation } from "./browserLocation";
export {
  resolveUgandaPlaceCoords,
  shortPlaceLabel,
  normalizePlaceQuery,
} from "./ugandaPlaces";
export {
  geocodeSearch,
  geocodeFirst,
  reverseGeocode,
  labelFromReverse,
  searchPlaceNames,
} from "./nominatimClient";
export {
  buildNearMeDistanceMap,
  productPlaceLabel,
  resolvePlaceCoords,
} from "./nearMeRanking";
