import { createDomainApiService } from "@/services/domain-api";
import type { ApiResult } from "@/services/http";

export type NotificationItem = {
  id: string | number;
  type?: string | null;
  title?: string | null;
  message?: string | null;
  subtitle?: string | null;
  description?: string | null;
  createdAt?: string | null;
  is_read?: boolean;
};

export type NotificationMeta = {
  page?: number;
  hasNext?: boolean;
};

const notificationsService = createDomainApiService();

export const getNotifications = notificationsService.get;
export const postNotifications = notificationsService.post;
export const patchNotifications = notificationsService.patch;
export const deleteNotifications = notificationsService.del;

const normalizeNotificationList = (response: ApiResult): NotificationItem[] => {
  if (Array.isArray(response.data)) return response.data as NotificationItem[];

  if (typeof response.data === "object" && response.data !== null && !Array.isArray(response.data)) {
    const data = response.data as Record<string, unknown>;

    if (Array.isArray(data.data)) return data.data as NotificationItem[];
    if (Array.isArray(data.items)) return data.items as NotificationItem[];
  }

  return [];
};

export const fetchNotificationsPage = async ({
  page,
  limit,
  token,
}: {
  page: number;
  limit: number;
  token?: string | null;
}) => {
  const response = await getNotifications(`/v1/notifications?page=${page}&limit=${limit}`, token);

  return {
    response,
    notifications: normalizeNotificationList(response),
    meta: response.meta as NotificationMeta | undefined,
  };
};
