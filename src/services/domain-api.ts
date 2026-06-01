import { deleteRequest, getRequest, patchRequest, postRequest, type ApiResult } from "@/services/http";

export type DomainApiService = {
  get: (endpoint: string, token?: string | null) => Promise<ApiResult>;
  post: (endpoint: string, body: unknown, token?: string | null) => Promise<ApiResult>;
  patch: (endpoint: string, body: unknown, token?: string | null) => Promise<ApiResult>;
  del: (endpoint: string, token?: string | null) => Promise<ApiResult>;
};

export const createDomainApiService = (): DomainApiService => ({
  get: (endpoint, token) => getRequest(endpoint, token),
  post: (endpoint, body, token) => postRequest(endpoint, body, token),
  patch: (endpoint, body, token) => patchRequest(endpoint, body, token),
  del: (endpoint, token) => deleteRequest(endpoint, token),
});
