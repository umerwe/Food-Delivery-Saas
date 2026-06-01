const loginPath = "/auth/login";

const isUnsafeRedirect = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();

  return (
    !normalizedValue.startsWith("/") ||
    normalizedValue.startsWith("//") ||
    normalizedValue.startsWith("/\\\\") ||
    normalizedValue.includes("://") ||
    normalizedValue.startsWith("javascript:")
  );
};

export const getSafeRedirectPath = (redirectTo?: string | null) => {
  if (!redirectTo) {
    return "/";
  }

  const trimmedRedirect = redirectTo.trim();

  if (!trimmedRedirect || isUnsafeRedirect(trimmedRedirect)) {
    return "/";
  }

  return trimmedRedirect;
};

export const buildLoginRoute = (redirectTo?: string | null) => {
  const safeRedirectPath = getSafeRedirectPath(redirectTo);

  if (safeRedirectPath === "/") {
    return loginPath;
  }

  return `${loginPath}?redirect=${encodeURIComponent(safeRedirectPath)}`;
};
