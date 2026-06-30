import { buildApiUrl } from "@/lib/api-endpoint";
import { API_BASE_URL } from "@/lib/constants";
import { isAuthSession, isAuthUser } from "@/lib/auth";
import type {
  AuthSession,
  AuthUser,
  ForgotPasswordPayload,
  GoogleLoginCustomerPayload,
  GuestLoginCustomerPayload,
  LoginCustomerPayload,
  RefreshTokenPayload,
  ResetPasswordPayload,
  SignupCustomerPayload,
  VerifySignupOtpPayload,
} from "@/types/auth";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getMessage = (value: unknown, fallback: string) => {
  if (!isRecord(value)) {
    return fallback;
  }

  const message = value.message;
  return typeof message === "string" && message.trim() ? message : fallback;
};

const getResponseData = (value: unknown) => (isRecord(value) ? value.data : undefined);

const requestAuth = async (endpoint: string, init: RequestInit = {}) => {
  const res = await fetch(buildApiUrl(API_BASE_URL, endpoint), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = (await res.json()) as unknown;

  if (!res.ok) {
    throw new Error(getMessage(payload, "Request failed"));
  }

  return payload;
};

const postAuth = (endpoint: string, body: unknown, token?: string) =>
  requestAuth(endpoint, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(body),
  });

const normalizeAuthSession = (payload: unknown, fallback = "Invalid auth response"): AuthSession => {
  const data = getResponseData(payload);

  if (!isAuthSession(data)) {
    throw new Error(fallback);
  }

  return data;
};

const normalizeAuthUser = (payload: unknown, fallback = "Invalid user response"): AuthUser => {
  const data = getResponseData(payload);

  if (!isAuthUser(data)) {
    throw new Error(fallback);
  }

  return data;
};

export const loginCustomer = async (payload: LoginCustomerPayload) =>
  normalizeAuthSession(await postAuth("/v1/auth/login", payload), "Login failed");

export const googleLoginCustomer = async (payload: GoogleLoginCustomerPayload) =>
  normalizeAuthSession(await postAuth("/v1/auth/google-login", payload), "Google login failed");

export const guestLoginCustomer = async (payload: GuestLoginCustomerPayload) =>
  normalizeAuthSession(await postAuth("/v1/auth/register-guest", payload), "Guest login failed");

export const signupCustomer = async (payload: SignupCustomerPayload) =>
  normalizeAuthSession(await postAuth("/v1/auth/register-customer", payload), "Registration failed");

export const verifySignupOtp = (payload: VerifySignupOtpPayload, token: string) =>
  postAuth("/v1/auth/verify-email", payload, token);

export const forgotPassword = (payload: ForgotPasswordPayload) =>
  postAuth("/v1/auth/forgot-password", payload);

export const resetPassword = (payload: ResetPasswordPayload) =>
  postAuth("/v1/auth/reset-password", payload);

export const resendResetOtp = (payload: ForgotPasswordPayload) =>
  postAuth("/v1/auth/resend-otp", payload);

export const refreshCustomerToken = async (payload: RefreshTokenPayload) => {
  const response = await postAuth("/v1/auth/refresh", payload);
  const data = getResponseData(response);

  if (!isRecord(data)) {
    throw new Error("Refresh token failed");
  }

  const accessToken = data.accessToken;
  const refreshToken = data.refreshToken;

  if (typeof accessToken !== "string") {
    throw new Error("Refresh token failed");
  }

  return {
    accessToken,
    refreshToken: typeof refreshToken === "string" ? refreshToken : undefined,
  };
};

export const getCurrentUser = async (token: string) => {
  const payload = await requestAuth("/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return normalizeAuthUser(payload, "FETCH_ME_FAILED");
};
