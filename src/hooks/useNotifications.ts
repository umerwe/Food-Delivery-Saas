"use client";

import { useCallback, useMemo } from "react";

import { queryKeys } from "@/config/query-keys";
import { useDomainApi } from "@/hooks/useDomainApi";
import {
  deleteNotifications,
  fetchNotificationsPage,
  getNotifications,
  patchNotifications,
  postNotifications,
} from "@/services/notifications";

const service = {
  get: getNotifications,
  post: postNotifications,
  patch: patchNotifications,
  del: deleteNotifications,
};

export const useNotifications = (token: string | null) => {
  const api = useDomainApi(token, { service, requestKey: queryKeys.notifications.request });

  const getNotificationsPage = useCallback(
    ({ page, limit }: { page: number; limit: number }) => fetchNotificationsPage({ page, limit, token }),
    [token]
  );

  return useMemo(
    () => ({
      ...api,
      fetchNotificationsPage: getNotificationsPage,
    }),
    [api, getNotificationsPage]
  );
};

export default useNotifications;
