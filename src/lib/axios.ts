import axios, { AxiosHeaders } from "axios";

import { getRequestLocale } from "@/config/i18n";
import { normalizeApiEndpoint as normalizeEndpointForBase } from "@/lib/api-endpoint";
import { getAuthToken } from "@/lib/auth";

const apiVersionPath = ["api", "v1"].join("/");
const defaultApiBaseUrl = `https://deliveryway.dcodax.co/${apiVersionPath}`;

const normalizeBaseUrl = (value?: string) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue.replace(/\/+$/, "") : defaultApiBaseUrl;
};

export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

export const normalizeApiEndpoint = (endpoint: string, baseUrl = API_BASE_URL) =>
  normalizeEndpointForBase(endpoint, baseUrl);

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  const headers = AxiosHeaders.from(config.headers);

  headers.set("Accept-Language", getRequestLocale());

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  config.headers = headers;

  return config;
});

export type ApiResponse<T = unknown> = {
  data?: T;
  message?: string;
  meta?: unknown;
};
