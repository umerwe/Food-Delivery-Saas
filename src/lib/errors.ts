const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getStringProperty = (source: unknown, key: string): string | undefined => {
  if (!isRecord(source)) {
    return undefined;
  }

  const value = source[key];
  return typeof value === "string" && value.trim() ? value : undefined;
};

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const directMessage = getStringProperty(error, "message");
  if (directMessage) {
    return directMessage;
  }

  if (isRecord(error)) {
    const responseMessage = getStringProperty(error.response, "message");
    if (responseMessage) {
      return responseMessage;
    }

    const responseDataMessage = isRecord(error.response)
      ? getStringProperty(error.response.data, "message")
      : undefined;

    if (responseDataMessage) {
      return responseDataMessage;
    }
  }

  return fallback;
};
