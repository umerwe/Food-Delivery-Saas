const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getNestedData = (response: unknown) => (isRecord(response) ? response.data : undefined);

export const unwrapData = <T = unknown>(response: unknown): T => {
  const firstData = getNestedData(response);
  const secondData = getNestedData(firstData);

  return (secondData ?? firstData ?? response) as T;
};

export const getArrayData = <T = unknown>(response: unknown): T[] => {
  const data = unwrapData<unknown>(response);

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (isRecord(data)) {
    for (const key of ["items", "results", "records", "rows"]) {
      const value = data[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }

  return [];
};

export const getMeta = (response: unknown): Record<string, unknown> => {
  const candidates = [response, getNestedData(response), unwrapData(response)];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) {
      continue;
    }

    const meta = candidate.meta ?? candidate.pagination;
    if (isRecord(meta)) {
      return meta;
    }
  }

  return {};
};
