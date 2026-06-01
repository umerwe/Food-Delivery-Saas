"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

import type { ApiResult } from "@/services/http";
import type { DomainApiService } from "@/services/domain-api";

type MutationArgs = {
  endpoint: string;
  body?: unknown;
};

type DomainApiHookConfig = {
  service: DomainApiService;
  requestKey: (endpoint: string) => QueryKey;
};

export type DomainApiHook = {
  loading: boolean;
  get: (endpoint: string) => Promise<ApiResult>;
  post: (endpoint: string, body: unknown) => Promise<ApiResult>;
  patch: (endpoint: string, body: unknown) => Promise<ApiResult>;
  del: (endpoint: string) => Promise<ApiResult>;
};

export const useDomainApi = (
  token: string | null,
  { service, requestKey }: DomainApiHookConfig
): DomainApiHook => {
  const queryClient = useQueryClient();
  const [queryLoading, setQueryLoading] = useState(false);

  const postMutation = useMutation({
    mutationFn: ({ endpoint, body }: MutationArgs) => service.post(endpoint, body, token),
  });
  const patchMutation = useMutation({
    mutationFn: ({ endpoint, body }: MutationArgs) => service.patch(endpoint, body, token),
  });
  const deleteMutation = useMutation({
    mutationFn: ({ endpoint }: MutationArgs) => service.del(endpoint, token),
  });

  const get = useCallback(
    async (endpoint: string) => {
      setQueryLoading(true);
      try {
        return await queryClient.fetchQuery({
          queryKey: requestKey(endpoint),
          queryFn: () => service.get(endpoint, token),
          staleTime: 0,
        });
      } finally {
        setQueryLoading(false);
      }
    },
    [queryClient, requestKey, service, token]
  );

  const loading = queryLoading || postMutation.isPending || patchMutation.isPending || deleteMutation.isPending;

  const post = useCallback(
    (endpoint: string, body: unknown) => postMutation.mutateAsync({ endpoint, body }),
    [postMutation.mutateAsync]
  );

  const patch = useCallback(
    (endpoint: string, body: unknown) => patchMutation.mutateAsync({ endpoint, body }),
    [patchMutation.mutateAsync]
  );

  const del = useCallback(
    (endpoint: string) => deleteMutation.mutateAsync({ endpoint }),
    [deleteMutation.mutateAsync]
  );

  return useMemo(
    () => ({
      loading,
      get,
      post,
      patch,
      del,
    }),
    [del, get, loading, patch, post]
  );
};
