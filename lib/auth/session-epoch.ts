/** Monotonic token so an older in-flight /auth/me cannot overwrite a newer login or logout. */
let sessionWriteEpoch = 0;

export function currentSessionEpoch(): number {
  return sessionWriteEpoch;
}

export function claimSessionWrite(): number {
  sessionWriteEpoch += 1;
  return sessionWriteEpoch;
}

export function isCurrentSessionWrite(epoch: number): boolean {
  return epoch === sessionWriteEpoch;
}
