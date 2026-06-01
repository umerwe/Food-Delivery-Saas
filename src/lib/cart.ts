import { safeGetLocalStorageItem, safeRemoveLocalStorageItem, safeSetLocalStorageItem } from "@/lib/browser-storage";

const SIGNUP_ACCESS_TOKEN_KEY = "signupAccessToken";

export const getSignupAccessToken = () => safeGetLocalStorageItem(SIGNUP_ACCESS_TOKEN_KEY);

export const setSignupAccessToken = (token: string) => {
  safeSetLocalStorageItem(SIGNUP_ACCESS_TOKEN_KEY, token);
};

export const clearSignupAccessToken = () => {
  safeRemoveLocalStorageItem(SIGNUP_ACCESS_TOKEN_KEY);
};
