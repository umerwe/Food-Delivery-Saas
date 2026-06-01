export type ReverseGeocodeResult = {
  ok: boolean;
  displayName?: string;
  address?: Record<string, unknown>;
};

export const reverseGeocode = async (latitude: number, longitude: number): Promise<ReverseGeocodeResult> => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
  );

  if (!response.ok) {
    return { ok: false };
  }

  const data = (await response.json()) as unknown;

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: true };
  }

  const record = data as Record<string, unknown>;
  const address = record.address;

  return {
    ok: true,
    displayName: typeof record.display_name === "string" ? record.display_name : undefined,
    address: typeof address === "object" && address !== null && !Array.isArray(address) ? address as Record<string, unknown> : undefined,
  };
};
