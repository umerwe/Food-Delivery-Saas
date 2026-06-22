type AddressRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AddressRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getText = (value: unknown) => {
  if (typeof value === "string") {
    const text = value.trim();
    return text && text.toLowerCase() !== "null" ? text : "";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
};

const getField = (record: AddressRecord, keys: string[]) => {
  for (const key of keys) {
    const text = getText(record[key]);

    if (text) return text;
  }

  return "";
};

const removePostalCityComma = (value: string) =>
  value.replace(/\b(\d{4,6}),\s+([^,\d][^,]*)/g, "$1 $2");

export const getAddressRecord = (value: unknown) => {
  if (!isRecord(value)) return null;

  if (isRecord(value.address)) return value.address;
  if (isRecord(value.location)) return value.location;
  if (isRecord(value.businessAddress)) return value.businessAddress;

  return value;
};

export const formatDisplayAddress = (
  value: unknown,
  options: { includeRegionCountry?: boolean; fallback?: string } = {}
) => {
  if (typeof value === "string") {
    return removePostalCityComma(value.trim());
  }

  const address = getAddressRecord(value);

  if (!address) return options.fallback ?? "";

  const street = getField(address, ["street", "addressLine1", "line1", "address"]);
  const houseOrShop = getField(address, [
    "houseNumber",
    "shopNumber",
    "addressLine2",
    "line2",
    "area",
  ]);
  const firstLine =
    street && houseOrShop
      ? street.endsWith(".")
        ? `${street} ${houseOrShop}`
        : `${street}, ${houseOrShop}`
      : street || houseOrShop;
  const parts = [
    firstLine,
    [
      getField(address, ["postalCode", "zipCode", "zip"]),
      getField(address, ["city"]),
    ]
      .filter(Boolean)
      .join(" "),
  ];

  if (options.includeRegionCountry) {
    parts.push(
      getField(address, ["state", "province", "region"]),
      getField(address, ["country"])
    );
  }

  return removePostalCityComma(parts.filter(Boolean).join(", ")) || options.fallback || "";
};
