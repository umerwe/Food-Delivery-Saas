"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Loader2, PauseCircle, X } from "lucide-react";
import { toast } from "sonner";

import { ScheduleRail } from "@/components/pages/Checkout/components/ScheduleRail";
import {
  buildDeliveryTimeSlots,
  buildPickupTimeSlots,
  buildScheduleBreakLabels,
  formatPickupTimeLabel,
  getBranchScheduleForDate,
  getBranchScheduleTimeZone,
  getDateFromValue,
  getDateValue,
  getScheduleOrderTimeIso,
  isPastDateValue,
  isScheduleTimeAvailable,
} from "@/components/pages/Checkout/utils/pickup-schedule";
import { useAuth } from "@/hooks/useAuth";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { fetchReservationBranch } from "@/services/reservations";
import type { BranchRecord } from "@/types/branch-selector";
import type { GroupOrder } from "@/types/group-order";

type ScheduleMode = "now" | "schedule";

type GroupOrderScheduleDialogProps = {
  order: GroupOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (orderTime: string | null) => void;
};

const padDatePart = (value: number) => String(value).padStart(2, "0");

const buildUpcomingDates = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
};

const getCurrentSchedule = () => {
  const now = new Date();

  return {
    date: [now.getFullYear(), padDatePart(now.getMonth() + 1), padDatePart(now.getDate())].join("-"),
    time: [padDatePart(now.getHours()), padDatePart(now.getMinutes())].join(":"),
  };
};

const getScheduleType = (orderType?: string) =>
  String(orderType || "").toUpperCase() === "DELIVERY" ? "delivery" : "pickup";

const parseOrderTime = (orderTime?: string | null) => {
  if (!orderTime) return null;

  const date = new Date(orderTime);
  if (Number.isNaN(date.getTime())) return null;

  return {
    date: [date.getFullYear(), padDatePart(date.getMonth() + 1), padDatePart(date.getDate())].join("-"),
    time: [padDatePart(date.getHours()), padDatePart(date.getMinutes())].join(":"),
  };
};

const activeTileClass =
  "border-primary bg-white text-gray-950 shadow-[0_12px_34px_rgba(17,24,39,0.10)] ring-2 ring-primary/10";
const interactiveTileClass =
  "border-gray-100 bg-white text-gray-900 shadow-[0_12px_34px_rgba(17,24,39,0.08)] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_42px_rgba(17,24,39,0.12)] hover:text-primary";
const disabledTileClass = "cursor-not-allowed border-gray-100 bg-[#F7F3EF]/70 text-gray-400 shadow-none";

export function GroupOrderScheduleDialog({
  order,
  open,
  onOpenChange,
  onSaved,
}: GroupOrderScheduleDialogProps) {
  const { token } = useAuth();
  const { updateGroupOrderSchedule } = useGroupOrderApi(token);
  const initialSchedule = useMemo(() => getCurrentSchedule(), []);
  const scheduleDates = useMemo(() => buildUpcomingDates(), []);
  const parsedOrderTime = useMemo(() => parseOrderTime(order.orderTime), [order.orderTime]);
  const [resolvedBranch, setResolvedBranch] = useState<BranchRecord | null>(null);
  const branchId = String(order.branch?.id || (order as { branchId?: string | number | null }).branchId || "");
  const activeBranch = resolvedBranch || (order.branch as BranchRecord | null | undefined);
  const scheduleType = getScheduleType(order.orderType);
  const [date, setDate] = useState(parsedOrderTime?.date || initialSchedule.date);
  const [time, setTime] = useState(parsedOrderTime?.time || "");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("schedule");
  const [saving, setSaving] = useState(false);

  const scheduleState = useMemo(
    () => getBranchScheduleForDate({ branch: activeBranch, dateValue: date, scheduleType }),
    [activeBranch, date, scheduleType]
  );
  const timeSlots = useMemo(
    () => scheduleType === "delivery"
      ? buildDeliveryTimeSlots({ branch: activeBranch, dateValue: date })
      : buildPickupTimeSlots({ branch: activeBranch, dateValue: date }),
    [activeBranch, date, scheduleType]
  );
  const breakLabels = useMemo(
    () => buildScheduleBreakLabels(scheduleState.schedule),
    [scheduleState.schedule]
  );
  const scheduleHoursLabel = useMemo(() => {
    const schedule = scheduleState.schedule;

    if (!date || !schedule) return "";
    if (schedule.isClosed) return "Closed";

    return `${formatPickupTimeLabel(schedule.openTime || "")} - ${formatPickupTimeLabel(schedule.closeTime || "")}`;
  }, [date, scheduleState.schedule]);

  useEffect(() => {
    if (!open) return;

    const parsed = parseOrderTime(order.orderTime);
    setDate(parsed?.date || initialSchedule.date);
    setTime(parsed?.time || "");
    setScheduleMode("schedule");
  }, [initialSchedule.date, open, order.orderTime]);

  useEffect(() => {
    if (!open || !branchId) return;

    let mounted = true;

    const loadBranchSchedule = async () => {
      try {
        const { branch } = await fetchReservationBranch({ branchId, token });

        if (mounted && branch) {
          setResolvedBranch(branch);
        }
      } catch {
        if (mounted) {
          setResolvedBranch((order.branch as BranchRecord | null | undefined) ?? null);
        }
      }
    };

    void loadBranchSchedule();

    return () => {
      mounted = false;
    };
  }, [branchId, open, order.branch, token]);

  useEffect(() => {
    if (time && scheduleState.hasOpeningHours && !timeSlots.some((slot) => slot.value === time)) {
      setTime("");
    }
  }, [scheduleState.hasOpeningHours, time, timeSlots]);

  if (!open) return null;

  const saveSchedule = async () => {
    if (!order.id || saving) return;

    let orderTime: string | null = null;

    if (scheduleMode === "schedule") {
      if (!date || !time) {
        toast.error("Select a date and time.");
        return;
      }

      if (isPastDateValue(date)) {
        toast.error("Please select a future date.");
        return;
      }

      const dateValue = getDateValue(getDateFromValue(date) || new Date(`${date}T00:00:00`));

      if (
        !isScheduleTimeAvailable({
          branch: activeBranch,
          dateValue,
          timeValue: time,
          scheduleType,
        })
      ) {
        toast.error("Selected time is unavailable.");
        return;
      }

      orderTime = getScheduleOrderTimeIso({
        dateValue,
        timeValue: time,
        timeZone: getBranchScheduleTimeZone(activeBranch),
      });
    }

    try {
      setSaving(true);
      const response = await updateGroupOrderSchedule({ orderId: order.id, orderTime });

      if (!response || response.error) {
        toast.error(response?.message || response?.error || "Unable to update schedule.");
        return;
      }

      onSaved(orderTime);
      toast.success("Group order rescheduled.");
      onOpenChange(false);
    } catch {
      toast.error("Unable to update schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4 backdrop-blur-sm">
      <div className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600"
          aria-label="Close schedule editor"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="shrink-0 px-6 pb-4 pt-6 md:px-8 md:pt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Reschedule group order</h2>
          <p className="mt-1 text-sm text-gray-500">Choose an allowed business time for this group order.</p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-4 md:px-8">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Schedule</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Time cards below are generated from branch business hours.
                </p>
              </div>
            </div>
          </div>

          {scheduleMode === "schedule" ? (
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  {scheduleHoursLabel ? <span className="text-xs font-medium text-gray-500">{scheduleHoursLabel}</span> : null}
                </div>
                <ScheduleRail ariaLabel="Choose schedule date">
                  {scheduleDates.map((scheduleDate) => {
                    const nextDateValue = getDateValue(scheduleDate);
                    const dateScheduleState = getBranchScheduleForDate({
                      branch: activeBranch,
                      dateValue: nextDateValue,
                      scheduleType,
                    });
                    const availableSlots = scheduleType === "delivery"
                      ? buildDeliveryTimeSlots({ branch: activeBranch, dateValue: nextDateValue })
                      : buildPickupTimeSlots({ branch: activeBranch, dateValue: nextDateValue });
                    const disabled =
                      isPastDateValue(nextDateValue) ||
                      (dateScheduleState.hasOpeningHours &&
                        (Boolean(dateScheduleState.schedule?.isClosed) || availableSlots.length === 0));
                    const isSelected = date === nextDateValue;

                    return (
                      <button
                        key={nextDateValue}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setDate(nextDateValue);
                          setTime("");
                        }}
                        className={`min-w-[92px] snap-start rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                          isSelected
                            ? activeTileClass
                            : disabled
                              ? disabledTileClass
                              : interactiveTileClass
                        }`}
                      >
                        <span className="block text-xs font-semibold uppercase">
                          {scheduleDate.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="mt-1 block text-lg font-semibold">
                          {scheduleDate.getDate()}
                        </span>
                        <span className="block text-xs">
                          {scheduleDate.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </ScheduleRail>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-gray-700">Time</label>
                  {breakLabels.length ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                      <PauseCircle className="h-3.5 w-3.5" />
                      Break: {breakLabels.join(", ")}
                    </span>
                  ) : null}
                </div>
                {timeSlots.length ? (
                  <ScheduleRail ariaLabel="Choose schedule time">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setTime(slot.value)}
                        className={`h-[48px] min-w-[96px] snap-start rounded-[14px] border text-sm font-semibold transition-all duration-200 ${
                          time === slot.value ? activeTileClass : interactiveTileClass
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </ScheduleRail>
                ) : (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
                    No available business time slots for this date. Please choose another date.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:grid-cols-2 sm:px-6 md:px-8">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveSchedule}
            disabled={saving}
            className="inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-primary px-4 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(206,24,27,0.20)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Reschedule group order
          </button>
        </div>
      </div>
    </div>
  );
}
