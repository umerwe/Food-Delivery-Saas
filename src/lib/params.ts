export type QueryParamValue = string | number | boolean | null | undefined;
export type QueryParamInput = QueryParamValue | QueryParamValue[];
export type QueryParams = Record<string, QueryParamInput>;

const isPresentParamValue = (value: QueryParamValue): value is string | number | boolean =>
  value !== null && value !== undefined && value !== "";

export const cleanParams = (params: QueryParams) => {
  const cleaned: Record<string, string | number | boolean | Array<string | number | boolean>> = {};

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      const cleanedArray = value.filter(isPresentParamValue);

      if (cleanedArray.length > 0) {
        cleaned[key] = cleanedArray;
      }

      continue;
    }

    if (isPresentParamValue(value)) {
      cleaned[key] = value;
    }
  }

  return cleaned;
};
