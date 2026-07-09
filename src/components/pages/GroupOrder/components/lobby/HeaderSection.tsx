import { CalendarClock, MapPin, Store } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDisplayAddress } from "@/lib/address-display";
import { GroupOrderScheduleDialog } from "@/components/pages/GroupOrder/components/lobby/GroupOrderScheduleDialog";
import type { GroupOrder } from "@/types/group-order";

type HeaderSectionProps = {
  order: GroupOrder;
  canEditSchedule?: boolean;
  onScheduleUpdated?: (orderTime: string | null) => void;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
};

const getOrderTypeLabelKey = (orderType?: string) => {
  const normalized = String(orderType || "").toUpperCase();

  if (normalized === "DELIVERY") return "orderTypes.delivery";
  if (normalized === "TAKEAWAY") return "orderTypes.takeaway";
  if (normalized === "DINE_IN") return "orderTypes.dineIn";

  return "orderTypes.fallback";
};

export default function HeaderSection({ order, canEditSchedule = false, onScheduleUpdated }: HeaderSectionProps) {
  const t = useTranslations("groupOrder.lobby.header");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const participants = order?.participants ?? [];
  const total = order?.participantCount || participants.length || 0;
  const ready = participants.filter((p) => {
    if (p.isHost || String(p.userId || "") === String(order.hostUserId || "")) return true;

    return String(p.status || "").toUpperCase() === "COMPLETED";
  }).length;

  const percent = total ? (ready / total) * 100 : 0;
  const scheduledAt = formatDateTime(order.orderTime);
  const expiresAt = formatDateTime(order.expiresAt || order.expiryAt || order.expiresOn);
  const branchAddress = order.branch?.address ? formatDisplayAddress(order.branch.address) : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            {order?.restaurant?.name || t("fallbackTitle")}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {t("description")}
          </p>
        </div>

        <div className="bg-white rounded-2xl px-5 py-4 shadow-md border border-gray-100">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {t("groupStatus")}{" "}
          <span className="text-orange-500 font-semibold ml-1">
            {t("readyCount", { ready, total })}
          </span>
        </p>

        <div className="w-44 h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
          <div
            style={{ width: `${percent}%` }}
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
          />
        </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <CalendarClock className="h-4 w-4 text-primary" />
            {t("orderTiming")}
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {scheduledAt ? t("scheduledFor", { date: scheduledAt }) : t("instantOrder")}
          </p>
          {canEditSchedule ? (
            <button
              type="button"
              onClick={() => setScheduleOpen(true)}
              className="mt-3 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/10"
            >
              Edit schedule
            </button>
          ) : null}
          {expiresAt ? (
            <p className="mt-1 text-xs text-gray-500">{t("expiresAt", { date: expiresAt })}</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Store className="h-4 w-4 text-primary" />
            {t("orderType")}
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {t(getOrderTypeLabelKey(order.orderType))}
          </p>
          {order.restaurant?.name ? (
            <p className="mt-1 text-xs text-gray-500">{order.restaurant.name}</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <MapPin className="h-4 w-4 text-primary" />
            {t("branch")}
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {order.branch?.name || t("branchFallback")}
          </p>
          {branchAddress ? (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{branchAddress}</p>
          ) : null}
        </div>
      </div>
      {canEditSchedule ? (
        <GroupOrderScheduleDialog
          order={order}
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          onSaved={(orderTime) => onScheduleUpdated?.(orderTime)}
        />
      ) : null}
    </div>
  );
}
