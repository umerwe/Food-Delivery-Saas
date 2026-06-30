export const TIME_24_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function normalizeTime24(value: string): string {
  const [hours = "00", minutes = "00"] = String(value || "").split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function isTime24(value: string): boolean {
  return TIME_24_REGEX.test(normalizeTime24(value));
}

export function time24OrEmpty(value?: string | null): string {
  if (!value) return "";

  const normalized = normalizeTime24(value);
  return TIME_24_REGEX.test(normalized) ? normalized : "";
}
