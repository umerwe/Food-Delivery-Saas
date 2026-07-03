"use client";

import { useEffect, useMemo } from "react";
import { Clock } from "lucide-react";
import {
  buildPickupTimeSlots,
  formatPickupTimeLabel,
  getDateFromValue,
  getDateValue,
  getPickupScheduleForDate,
  isImmediateScheduleAvailable,
  isPastDateValue,
} from "@/components/pages/Checkout/utils/pickup-schedule";
import { ScheduleRail } from "@/components/pages/Checkout/components/ScheduleRail";
import { Time24Picker } from "@/components/ui/time-24-picker";
import type { BranchRecord } from "@/types/branch-selector";
import { useTranslations } from "next-intl";

interface Props {
  pickupDate: Date | null;
  setPickupDate: (value: Date | null) => void;
  pickupTime: string | null;
  setPickupTime: (value: string | null) => void;
  pickupScheduleMode: "now" | "schedule";
  setPickupScheduleMode: (value: "now" | "schedule") => void;
  selectedBranch?: BranchRecord | null;
}

const activeGradientClass =
  "border-primary bg-white text-gray-950 shadow-[0_12px_34px_rgba(17,24,39,0.10)] ring-2 ring-primary/10";
const interactiveTileClass =
  "border-gray-100 bg-white text-gray-900 shadow-[0_12px_34px_rgba(17,24,39,0.08)] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_42px_rgba(17,24,39,0.12)] hover:text-primary";
const disabledTileClass =
  "cursor-not-allowed border-gray-100 bg-[#F7F3EF]/70 text-gray-400 shadow-none";

const buildUpcomingDates = () => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);

    date.setDate(today.getDate() + index);

    return date;
  });
};

export function SelectPickupTimeSection({
  pickupDate,
  setPickupDate,
  pickupTime,
  setPickupTime,
  pickupScheduleMode,
  setPickupScheduleMode,
  selectedBranch,
}: Props) {
  const t = useTranslations("checkout");
  const dateValue = pickupDate ? getDateValue(pickupDate) : "";
  const dates = useMemo(() => buildUpcomingDates(), []);
  const immediateAvailable = useMemo(
    () => isImmediateScheduleAvailable({ branch: selectedBranch, scheduleType: "pickup" }),
    [selectedBranch]
  );
  const timeSlots = useMemo(
    () => buildPickupTimeSlots({ branch: selectedBranch, dateValue }),
    [dateValue, selectedBranch]
  );
  const scheduleState = useMemo(
    () => getPickupScheduleForDate({ branch: selectedBranch, dateValue }),
    [dateValue, selectedBranch]
  );
  const hasOpeningHours = scheduleState.hasOpeningHours;
  const openingHoursLabel = useMemo(() => {
    const schedule = scheduleState.schedule;

    if (!dateValue || !schedule) return "";
    if (schedule.isClosed) return t("closed");

    return `${formatPickupTimeLabel(schedule.openTime || "")} - ${formatPickupTimeLabel(
      schedule.closeTime || ""
    )}`;
  }, [dateValue, scheduleState.schedule, t]);

  const selectedTimeAvailable =
    !hasOpeningHours || timeSlots.some((slot) => slot.value === pickupTime);

  useEffect(() => {
    if (hasOpeningHours && pickupTime && !selectedTimeAvailable) {
      setPickupTime(null);
    }
  }, [hasOpeningHours, pickupTime, selectedTimeAvailable, setPickupTime]);

  useEffect(() => {
    if (!immediateAvailable && pickupScheduleMode === "now") {
      setPickupScheduleMode("schedule");
    }
  }, [immediateAvailable, pickupScheduleMode, setPickupScheduleMode]);

  return (
    <section className="max-w-[520px] space-y-[22px]">
      <h2 className="text-[24px] font-semibold text-gray-900">
        {t("pickupTiming")}
      </h2>
      <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!immediateAvailable}
            onClick={() => {
              setPickupScheduleMode("now");
              setPickupDate(null);
              setPickupTime(null);
            }}
            className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
              pickupScheduleMode === "now"
                ? activeGradientClass
                : !immediateAvailable
                  ? disabledTileClass
                  : interactiveTileClass
            }`}
          >
            <span className="block text-base font-semibold">{t("orderNow")}</span>
            <span className="mt-1 block text-xs leading-5 text-gray-500">
              {immediateAvailable ? t("pickupNowDescription") : t("pickupNowUnavailable")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPickupScheduleMode("schedule")}
            className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
              pickupScheduleMode === "schedule"
                ? activeGradientClass
                : interactiveTileClass
            }`}
          >
            <span className="block text-base font-semibold">{t("scheduleOrder")}</span>
            <span className="mt-1 block text-xs leading-5 text-gray-500">
              {t("schedulePickupDescription")}
            </span>
          </button>
        </div>
      </div>

      {pickupScheduleMode === "schedule" ? (
        <>

      {/* DATE */}
      <div className="space-y-[14px]">
        <h3 className="text-xl font-medium text-gray-900">
          {t("chooseDate")}
        </h3>

        <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
          <ScheduleRail ariaLabel={t("chooseDate")}>
            {dates.map((date) => {
              const nextDateValue = getDateValue(date);
              const dateScheduleState = getPickupScheduleForDate({
                branch: selectedBranch,
                dateValue: nextDateValue,
              });
              const availableSlots = buildPickupTimeSlots({
                branch: selectedBranch,
                dateValue: nextDateValue,
              });
              const disabled =
                isPastDateValue(nextDateValue) ||
                (dateScheduleState.hasOpeningHours &&
                  (Boolean(dateScheduleState.schedule?.isClosed) ||
                    availableSlots.length === 0));
              const isSelected = dateValue === nextDateValue;

              return (
                <button
                  key={nextDateValue}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setPickupDate(getDateFromValue(nextDateValue));
                    setPickupTime(null);
                  }}
                  className={`min-w-[92px] snap-start rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                    isSelected
                      ? activeGradientClass
                      : disabled
                        ? disabledTileClass
                        : interactiveTileClass
                  }`}
                >
                  <span className="block text-xs font-semibold uppercase">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="mt-1 block text-lg font-semibold">
                    {date.getDate()}
                  </span>
                  <span className="block text-xs">
                    {date.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                </button>
              );
            })}
          </ScheduleRail>

          {dateValue && openingHoursLabel ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Clock size={14} />
              {t("pickupHours", { hours: openingHoursLabel })}
            </p>
          ) : dateValue && !hasOpeningHours ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Clock size={14} />
              {t("pickupHoursNotConfigured")}
            </p>
          ) : null}
        </div>
      </div>

      {/* TIME */}
      <div className="space-y-[16px] mt-[52px]">
        <h3 className="text-xl font-medium text-gray-900">
          {t("choosePickupTime")}
        </h3>

        {hasOpeningHours ? (
          <ScheduleRail ariaLabel={t("choosePickupTime")}>
            {timeSlots.length > 0 ? (
              timeSlots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setPickupTime(slot.value)}
                  className={`h-[48px] min-w-[96px] snap-start rounded-[14px] border text-sm font-semibold transition-all duration-200 ${
                    pickupTime === slot.value
                      ? activeGradientClass
                      : interactiveTileClass
                  }`}
                >
                  {slot.label}
                </button>
              ))
            ) : (
              <p className="min-w-full rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                {t("noPickupSlots")}
              </p>
            )}
          </ScheduleRail>
        ) : (
          <label className="block max-w-[220px]">
            <span className="sr-only">{t("pickupTime")}</span>
            <Time24Picker
              value={pickupTime || ""}
              onChange={(value) => setPickupTime(value || null)}
              className="h-[48px] w-full rounded-[10px] border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
            />
          </label>
        )}
      </div>
        </>
      ) : null}
    </section>
  );
}
