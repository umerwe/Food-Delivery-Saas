import type { AuthSession, AuthUser } from "@/types/auth";
import { getBrowserStorage, safeGetLocalStorageItem } from "@/lib/browser-storage";

export const AUTH_STORAGE_KEY = "auth";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

export const isAuthUser = (value: unknown): value is AuthUser => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.email) &&
    isString(value.role) &&
    isString(value.tenantId)
  );
};

export const isAuthSession = (value: unknown): value is AuthSession => {
  if (!isRecord(value)) {
    return false;
  }

  return isString(value.accessToken) && isAuthUser(value.user);
};

export const readAuthSession = () => {
  try {
    const storedAuth = getBrowserStorage()?.getItem(AUTH_STORAGE_KEY);

    if (!storedAuth) {
      return null;
    }

    const parsedAuth = JSON.parse(storedAuth) as unknown;
    return isAuthSession(parsedAuth) ? parsedAuth : null;
  } catch {
    return null;
  }
};

export const saveAuthSession = (authSession: AuthSession) => {
  getBrowserStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(authSession));
};

export const clearAuthSession = () => {
  getBrowserStorage()?.removeItem(AUTH_STORAGE_KEY);
};

const parseRecord = (value: string | null): Record<string, unknown> | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as unknown;

    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const getNestedRecord = (record: Record<string, unknown> | null, key: string) => {
  const value = record?.[key];

  return isRecord(value) ? value : null;
};

const getNestedString = (record: Record<string, unknown> | null, key: string) => {
  const value = record?.[key];

  return typeof value === "string" || typeof value === "number" ? String(value) : null;
};

export const getStoredAuthState = () => parseRecord(safeGetLocalStorageItem(AUTH_STORAGE_KEY));

export const getStoredRestaurantId = () => {
  const auth = getStoredAuthState();
  const user = getNestedRecord(auth, "user");

  return getNestedString(user, "restaurantId");
};

export const getAuthToken = () => readAuthSession()?.accessToken ?? null;

export const mergeStoredUserState = (user: AuthUser, storedUser?: AuthUser | null): AuthUser => ({
  ...user,
  restaurantId: storedUser?.restaurantId ?? user.restaurantId ?? null,
  branchId: storedUser?.branchId ?? user.branchId ?? null,
  branch: storedUser?.branch ?? user.branch ?? null,
});

export const getAuthErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};
