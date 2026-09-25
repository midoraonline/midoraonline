/** While the Google callback is redeeming, a stale refresh must not hit the API. */
let pending = false;

export function setGoogleCallbackPending(value: boolean): void {
  pending = value;
}

export function isGoogleCallbackPending(): boolean {
  return pending;
}
