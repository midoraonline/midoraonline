const E164 = /^\+[1-9]\d{7,14}$/;
const SEPARATORS = /[\s\-().]/g;

/** Same rules as the API: 0700…, 256…, and 7… all become +256…. */
export function normalizePhone(raw: string | null | undefined, defaultCountry = "256"): string {
  let text = (raw ?? "").trim().replace(SEPARATORS, "");
  if (!text) throw new Error("Enter a phone number.");
  if (text.startsWith("00")) text = `+${text.slice(2)}`;
  else if (text.startsWith("+")) {
    /* already international */
  } else if (text.startsWith(defaultCountry)) text = `+${text}`;
  else if (text.startsWith("0")) text = `+${defaultCountry}${text.slice(1)}`;
  else text = `+${defaultCountry}${text}`;
  if (!E164.test(text)) throw new Error("Enter a valid phone number.");
  return text;
}
