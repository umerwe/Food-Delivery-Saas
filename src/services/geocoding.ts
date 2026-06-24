export type ReverseGeocodeResult = {
  ok: boolean;
  displayName?: string;
  address?: Record<string, unknown>;
};

export type ParsedReverseGeocodeAddress = {
  street: string;
  houseNumber: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const getAddressValue = (address: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = address[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

export const parseReverseGeocodeAddress = (
  address: Record<string, unknown> = {},
  displayName = ""
): ParsedReverseGeocodeAddress => {
  const hasStructuredAddress = Object.keys(address).length > 0;

  return {
    street:
      getAddressValue(address, [
        "road",
        "pedestrian",
        "footway",
        "cycleway",
        "path",
        "residential",
      ]) || (hasStructuredAddress ? "" : displayName.trim()),
    houseNumber: getAddressValue(address, ["house_number", "houseNumber"]),
    area: getAddressValue(address, [
      "suburb",
      "neighbourhood",
      "quarter",
      "village",
      "hamlet",
    ]),
    city: getAddressValue(address, [
      "city",
      "town",
      "village",
      "municipality",
      "county",
    ]),
    state: getAddressValue(address, ["state", "province", "region"]),
    postalCode: getAddressValue(address, ["postcode", "postalCode", "postal_code"]),
    country: getAddressValue(address, ["country"]),
  };
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
