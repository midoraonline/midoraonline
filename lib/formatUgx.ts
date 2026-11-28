const UGX_FORMAT = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

/** Shared UGX price text, e.g. "UGX 1,200,000". */
export function formatUGX(value: number): string {
  return UGX_FORMAT.format(value);
}
