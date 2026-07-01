"use client";

import { useEffect, useState } from "react";
import { Calendar, Wallet, Check, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import useNotifications from "@/hooks/useNotifications";
import type { NotificationItem, NotificationMeta } from "@/services/notifications";
import { useTranslations } from "next-intl";

export function NotificationsPage() {
  const t = useTranslations("notifications");
  const { token } = useAuth();
  const { fetchNotificationsPage } = useNotifications(token);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<NotificationMeta | null>(null);

  const getIcon = (item: NotificationItem) => {
    const type = String(item?.type || "").toLowerCase();

    if (type.includes("reservation")) {
      return {
        icon: Calendar,
        bg: "bg-indigo-50",
        iconColor: "text-indigo-500",
      };
    }

    if (type.includes("payout") || type.includes("payment")) {
      return {
        icon: Wallet,
        bg: "bg-green-50",
        iconColor: "text-green-500",
      };
    }

    return {
      icon: Check,
      bg: "bg-blue-50",
      iconColor: "text-blue-500",
    };
  };

  const getTypeLabel = (type?: string | null) => {
    switch (String(type || "").toUpperCase()) {
      case "GROUP_ORDER_PARTICIPANT_COMPLETED":
        return t("types.groupOrderParticipantCompleted");
      case "GROUP_ORDER_ALL_PARTICIPANTS_COMPLETED":
        return t("types.groupOrderAllParticipantsCompleted");
      default:
        return null;
    }
  };

  // -------- FETCH
  const fetchNotifications = async (pageNumber = 1, append = false) => {
    try {
      pageNumber === 1 ? setLoading(true) : setLoadingMore(true);

      const { notifications: newData, meta: nextMeta } = await fetchNotificationsPage({ page: pageNumber, limit: 10 });

      setNotifications((prev) =>
        append ? [...prev, ...newData] : newData
      );

      setMeta(nextMeta || null);
    } catch {
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchNotifications(1);
  }, [token]);
const hasNotifications = notifications.length > 0;
const hasUnread = notifications.some((n) => !n.is_read);
const disableMarkAll = !hasNotifications || !hasUnread;
  const handleLoadMore = () => {
    if (!meta?.hasNext) return;

    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const handleRefresh = async () => {
    if (loading || refreshing) return;

    try {
      setRefreshing(true);
      setPage(1);
      await fetchNotifications(1);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="max-w-6xl mx-auto">


        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t("title")}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t("description")}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? t("refreshing") : t("refresh")}
            </button>
            <button
              disabled={disableMarkAll}
              className={`w-full sm:w-auto text-sm px-4 py-2 rounded-md font-medium transition
                ${
                  disableMarkAll
                    ? "bg-primary text-white cursor-not-allowed"
                    : "bg-primary hover:bg-orange-600 text-white"
                }
              `}
            >
              {t("markAllAsRead")}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 text-sm text-gray-500 border-b border-gray-200 mb-4 overflow-x-auto">
          <button className="text-primary font-medium pb-2 border-b-2 border-primary whitespace-nowrap">
            {t("all")}
          </button>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

          {/* LOADING */}
          {loading ? (
            <div className="p-6 text-center text-gray-500">
              {t("loading")}
            </div>
          ) : notifications.length === 0 ? (
            /* EMPTY STATE */
            <div className="p-10 text-center text-gray-400">
              {t("empty")}
            </div>
          ) : (
            notifications.map((item, index) => {
              const { icon: Icon, bg, iconColor } = getIcon(item);
              const typeLabel = getTypeLabel(item.type);

              return (
                <div
                  key={item.id}
                  className={`px-4 sm:px-5 py-4 ${
                    index !== notifications.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    {/* Left */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">

                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${bg}`}
                      >
                        <Icon size={16} className={iconColor} />
                      </div>

                      {/* Text */}
                      <div className="min-w-0">
                        <p className="text-md font-semibold text-gray-900 truncate">
                          {item.title || t("fallbackTitle")}
                        </p>

                        {typeLabel ? (
                          <span className="mt-1 inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                            {typeLabel}
                          </span>
                        ) : null}

                        <p className="text-sm text-gray-600 mt-[2px] break-words">
                          {item.message || item.subtitle || ""}
                        </p>

                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1 break-words">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <span className="text-xs text-gray-400 sm:whitespace-nowrap">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            hourCycle: "h23",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* LOAD MORE */}
        {meta?.hasNext && (
          <div className="text-center mt-5">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-sm text-blue-500 hover:underline disabled:opacity-50"
            >
              {loadingMore ? t("loadingMore") : t("loadMore")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
