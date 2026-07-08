"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Time24Picker } from "@/components/ui/time-24-picker";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { useAuth } from "@/hooks/useAuth";
import { useCheckout } from "@/hooks/useCheckout";
import { BranchSelect } from "@/components/ui/BranchSelect";
import { Clock, Loader2, MapPin, PauseCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { resolveGroupOrderDeliveryAddressId, setStoredGroupOrderCode } from "@/lib/group-order";
import { formatDisplayAddress } from "@/lib/address-display";
import { getBackendErrorMessage, hasBackendError } from "@/components/pages/Checkout/utils/checkout-normalizers";
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
  isImmediateScheduleAvailable,
  isPastDateValue,
  isScheduleTimeAvailable,
} from "@/components/pages/Checkout/utils/pickup-schedule";
import { normalizeBranch } from "@/lib/branch-selector";
import { fetchAddresses as fetchProfileAddresses, type AddressRecord } from "@/services/profile";
import type { CreateGroupOrderPayload, GroupOrderType } from "@/types/group-order";
import type { BranchRecord } from "@/types/branch-selector";

type GroupOrderModalProps = { open: boolean; onClose: () => void };
type ScheduleMode = "now" | "schedule";

const padDatePart = (value: number) => String(value).padStart(2, "0");

const getCurrentSchedule = () => {
  const now = new Date();

  return {
    date: [
      now.getFullYear(),
      padDatePart(now.getMonth() + 1),
      padDatePart(now.getDate()),
    ].join("-"),
    time: [padDatePart(now.getHours()), padDatePart(now.getMinutes())].join(":"),
  };
};

const getLocalScheduleDate = (date: string, time: string) => {
  const scheduleDate = new Date(`${date}T${time}`);

  return Number.isNaN(scheduleDate.getTime()) ? null : scheduleDate;
};

const getScheduleType = (orderType: GroupOrderType) =>
  orderType === "DELIVERY" ? "delivery" : "pickup";

const buildUpcomingDates = () => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);

    date.setDate(today.getDate() + index);

    return date;
  });
};

const activeTileClass =
  "border-primary bg-white text-gray-950 shadow-[0_12px_34px_rgba(17,24,39,0.10)] ring-2 ring-primary/10";
const interactiveTileClass =
  "border-gray-100 bg-white text-gray-900 shadow-[0_12px_34px_rgba(17,24,39,0.08)] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_42px_rgba(17,24,39,0.12)] hover:text-primary";
const disabledTileClass =
  "cursor-not-allowed border-gray-100 bg-[#F7F3EF]/70 text-gray-400 shadow-none";

export function GroupOrderModal({ open, onClose }: GroupOrderModalProps) {
  const t = useTranslations("groupOrder.modal");
  const checkoutT = useTranslations("checkout");
  const commonT = useTranslations("common");
  const errorT = useTranslations("errors");
  const { user, token } = useAuth();
  const { createGroupOrder, loading } = useGroupOrderApi(token);
  const { get } = useCheckout(token);
  const router = useRouter();
  const initialSchedule = useMemo(() => getCurrentSchedule(), []);
  const scheduleDates = useMemo(() => buildUpcomingDates(), []);
  const [selectedBranch, setSelectedBranch] = useState<BranchRecord | null>(null);
  const [date, setDate] = useState(initialSchedule.date);
  const [time, setTime] = useState("");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("now");
  const [note, setNote] = useState("");
  const [orderType, setOrderType] = useState<GroupOrderType>("DINE_IN");
  const [deliveryAddresses, setDeliveryAddresses] = useState<AddressRecord[]>([]);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState("");
  const [loadingDeliveryAddresses, setLoadingDeliveryAddresses] = useState(false);

  const loadDeliveryAddresses = useCallback(async () => {
    try {
      setLoadingDeliveryAddresses(true);
      const addresses = await fetchProfileAddresses({ get });
      const resolvedAddressId = resolveGroupOrderDeliveryAddressId({
        addresses,
        selectedAddressId: selectedDeliveryAddress,
      });

      setDeliveryAddresses(addresses);
      setSelectedDeliveryAddress(resolvedAddressId);

      return {
        addresses,
        selectedAddressId: resolvedAddressId,
      };
    } catch (error) {
      setDeliveryAddresses([]);
      setSelectedDeliveryAddress("");
      return {
        addresses: [],
        selectedAddressId: "",
      };
    } finally {
      setLoadingDeliveryAddresses(false);
    }
  }, [get, selectedDeliveryAddress]);

  useEffect(() => {
    if (!open) return;

    const currentSchedule = getCurrentSchedule();
    setDate(currentSchedule.date);
    setTime("");
    setScheduleMode("now");
  }, [open]);

  useEffect(() => {
    if (!open || orderType !== "DELIVERY") return;

    void loadDeliveryAddresses();
  }, [loadDeliveryAddresses, open, orderType]);

  const activeBranch = useMemo(
    () => selectedBranch ?? normalizeBranch(user?.branch),
    [selectedBranch, user?.branch]
  );
  const scheduleType = getScheduleType(orderType);
  const immediateAvailable = useMemo(
    () => isImmediateScheduleAvailable({ branch: activeBranch, scheduleType }),
    [activeBranch, scheduleType]
  );
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
  const selectedScheduleDate = useMemo(
    () => (date && time ? getLocalScheduleDate(date, time) : null),
    [date, time]
  );

  const selectedScheduleLabel = scheduleMode === "now"
    ? checkoutT("orderNow")
    : selectedScheduleDate
      ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
        hourCycle: "h23",
      }).format(selectedScheduleDate)
    : t("selectDateTime");

  const scheduleHoursLabel = useMemo(() => {
    const schedule = scheduleState.schedule;

    if (!date || !schedule) return "";
    if (schedule.isClosed) return checkoutT("closed");

    return `${formatPickupTimeLabel(schedule.openTime || "")} - ${formatPickupTimeLabel(
      schedule.closeTime || ""
    )}`;
  }, [checkoutT, date, scheduleState.schedule]);

  useEffect(() => {
    if (!immediateAvailable && scheduleMode === "now") {
      setScheduleMode("schedule");
    }
  }, [immediateAvailable, scheduleMode]);

  useEffect(() => {
    if (time && scheduleState.hasOpeningHours && !timeSlots.some((slot) => slot.value === time)) {
      setTime("");
    }
  }, [scheduleState.hasOpeningHours, time, timeSlots]);

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      const branchId = activeBranch?.id || user?.branchId;

      if (!branchId) return toast.error(t("selectBranch"));

      let orderTime: string | null = null;

      if (scheduleMode === "now") {
        if (!isImmediateScheduleAvailable({ branch: activeBranch, scheduleType })) {
          return toast.error(
            orderType === "DELIVERY"
              ? t("instantDeliveryUnavailable")
              : t("instantPickupUnavailable")
          );
        }
      } else {
        if (!date || !time || !selectedScheduleDate) {
          return toast.error(t("selectDateTime"));
        }

        if (isPastDateValue(date)) {
          return toast.error(errorT("reservationPastDate"));
        }

        const dateValue = getDateValue(selectedScheduleDate);

        if (
          !isScheduleTimeAvailable({
            branch: activeBranch,
            dateValue,
            timeValue: time,
            scheduleType,
          })
        ) {
          return toast.error(
            orderType === "DELIVERY"
              ? t("scheduledDeliveryUnavailable")
              : t("scheduledPickupUnavailable")
          );
        }

        orderTime = getScheduleOrderTimeIso({
          dateValue,
          timeValue: time,
          timeZone: getBranchScheduleTimeZone(activeBranch),
        });
      }

      let deliveryAddressId = "";

      if (orderType === "DELIVERY") {
        deliveryAddressId = resolveGroupOrderDeliveryAddressId({
          addresses: deliveryAddresses,
          selectedAddressId: selectedDeliveryAddress,
        });

        if (!deliveryAddressId) {
          const deliveryAddressState = await loadDeliveryAddresses();
          deliveryAddressId = deliveryAddressState.selectedAddressId;
        }
      }

      if (orderType === "DELIVERY" && !deliveryAddressId) {
        return toast.error(t("selectDeliveryAddress"));
      }

      const payload: CreateGroupOrderPayload = {
        branchId,
        orderType,
        deliveryAddressId: orderType === "DELIVERY" ? deliveryAddressId : null,
        orderTime,
        hostNote: note || null,
      };

      const res = await createGroupOrder({ payload });

      if (hasBackendError(res)) {
        return toast.error(getBackendErrorMessage(res, t("failedCreate")));
      }

      const dataRecord =
        typeof res?.data === "object" && res.data !== null
          ? res.data as Record<string, unknown>
          : null;
      const inviteCode = String(dataRecord?.inviteCode || "");

      if (!inviteCode) {
        return toast.error(t("inviteCodeMissing"));
      }

      setStoredGroupOrderCode(inviteCode);

      toast.success(t("created"));

      onClose();
      router.push(`/group-order/invite?code=${inviteCode}`);

    } catch (err) {
      toast.error(errorT("somethingWentWrong"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4 backdrop-blur-sm">

      <div className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="shrink-0 px-6 pb-4 pt-6 md:px-8 md:pt-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            {t("title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("description")}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-4 md:px-8">

          {/* BRANCH */}
          <BranchSelect
            value={selectedBranch}
            onChange={setSelectedBranch}
          />

          {/* ORDER TYPE */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t("orderType")}
            </label>

            <div className="grid grid-cols-3 gap-2 mt-2">
              {(["DINE_IN", "TAKEAWAY", "DELIVERY"] as GroupOrderType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type as GroupOrderType)}
                  className={`h-11 rounded-full text-sm font-medium transition ${
                    orderType === type
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t(`orderTypes.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {orderType === "DELIVERY" ? (
            <div className="rounded-[22px] border border-gray-100 bg-[#FAFAF9] p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {t("deliveryAddress")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {t("deliveryAddressSubtitle")}
                  </p>

                  {loadingDeliveryAddresses ? (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-500 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      {t("loadingAddresses")}
                    </div>
                  ) : deliveryAddresses.length > 0 ? (
                    <div className="mt-4 grid gap-2">
                      {deliveryAddresses.map((address) => {
                        const isSelected = selectedDeliveryAddress === address.id;
                        const addressLabel = formatDisplayAddress(address) || t("unnamedAddress");

                        return (
                          <button
                            key={address.id}
                            type="button"
                            onClick={() => setSelectedDeliveryAddress(address.id)}
                            className={`w-full rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                              isSelected
                                ? "border-primary/30 bg-white text-gray-950 shadow-sm ring-2 ring-primary/10"
                                : "border-gray-100 bg-white/80 text-gray-600 hover:border-primary/20 hover:bg-white"
                            }`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="leading-5">{addressLabel}</span>
                              {address.isDefault ? (
                                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                                  {t("defaultAddress")}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-700">
                      {t("noDeliveryAddresses")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* DATE + TIME */}
          <div className="rounded-[22px] border border-gray-100 bg-[#FAFAF9] p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {orderType === "DELIVERY" ? checkoutT("deliveryTiming") : checkoutT("pickupTiming")}
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                {selectedScheduleLabel}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={!immediateAvailable}
                onClick={() => {
                  setScheduleMode("now");
                  setTime("");
                }}
                className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                  scheduleMode === "now"
                    ? activeTileClass
                    : !immediateAvailable
                      ? disabledTileClass
                      : interactiveTileClass
                }`}
              >
                <span className="block text-base font-semibold">{checkoutT("orderNow")}</span>
                <span className="mt-1 block text-xs leading-5 text-gray-500">
                  {immediateAvailable
                    ? orderType === "DELIVERY"
                      ? checkoutT("orderNowDescription")
                      : checkoutT("pickupNowDescription")
                    : orderType === "DELIVERY"
                      ? checkoutT("orderNowUnavailable")
                      : checkoutT("pickupNowUnavailable")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleMode("schedule")}
                className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                  scheduleMode === "schedule" ? activeTileClass : interactiveTileClass
                }`}
              >
                <span className="block text-base font-semibold">{checkoutT("scheduleOrder")}</span>
                <span className="mt-1 block text-xs leading-5 text-gray-500">
                  {orderType === "DELIVERY"
                    ? checkoutT("scheduleOrderDescription")
                    : checkoutT("schedulePickupDescription")}
                </span>
              </button>
            </div>

            {scheduleMode === "schedule" ? (
              <>
                <ScheduleRail ariaLabel={checkoutT("chooseDate")} className="mt-5">
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
                        (Boolean(dateScheduleState.schedule?.isClosed) ||
                          availableSlots.length === 0));
                    const isSelected = date === nextDateValue;

                    return (
                      <button
                        key={nextDateValue}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          const nextDate = getDateFromValue(nextDateValue);

                          if (!nextDate) return;

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

                {date && scheduleHoursLabel ? (
                  <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={14} />
                    {scheduleType === "delivery"
                      ? checkoutT("deliveryHoursForDate", { hours: scheduleHoursLabel })
                      : checkoutT("pickupHours", { hours: scheduleHoursLabel })}
                    {scheduleType === "delivery" && scheduleState.source === "opening"
                      ? ` ${checkoutT("usingOpeningHours")}`
                      : ""}
                  </p>
                ) : date && !scheduleState.hasOpeningHours ? (
                  <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={14} />
                    {scheduleType === "delivery"
                      ? checkoutT("deliveryHoursNotConfigured")
                      : checkoutT("pickupHoursNotConfigured")}
                  </p>
                ) : null}

                {scheduleType === "delivery" && breakLabels.length > 0 ? (
                  <div className="mt-3 rounded-[18px] border border-orange-100 bg-orange-50/80 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-orange-600 shadow-sm">
                        <PauseCircle size={18} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {checkoutT("deliveryBreakHoursTitle")}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-gray-600">
                          {checkoutT("deliveryBreakHoursDescription")}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {breakLabels.map((breakLabel) => (
                            <span
                              key={`${breakLabel.label}-${breakLabel.note || ""}`}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm ring-1 ring-orange-100"
                            >
                              {checkoutT("deliveryBreakTime", { time: breakLabel.label })}
                              {breakLabel.note ? ` · ${breakLabel.note}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <ScheduleRail
                  ariaLabel={scheduleType === "delivery" ? checkoutT("deliveryTime") : checkoutT("choosePickupTime")}
                  className="mt-4"
                >
                  {scheduleState.hasOpeningHours ? (
                    timeSlots.length > 0 ? (
                      timeSlots.map((slot) => (
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
                      ))
                    ) : (
                      <p className="min-w-full rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                        {scheduleType === "delivery" ? checkoutT("noDeliverySlots") : checkoutT("noPickupSlots")}
                      </p>
                    )
                  ) : (
                    <label className="block max-w-[220px]">
                      <span className="sr-only">
                        {scheduleType === "delivery" ? checkoutT("deliveryTime") : checkoutT("pickupTime")}
                      </span>
                      <Time24Picker
                        value={time}
                        onChange={setTime}
                        className="h-[48px] w-full rounded-[10px] border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
                      />
                    </label>
                  )}
                </ScheduleRail>
              </>
            ) : null}
          </div>

          {/* NOTE */}
          <div>
            <label className="text-sm text-gray-600">
              {t("hostNote")}
            </label>
            <Textarea
              placeholder={t("hostNotePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 resize-none h-[100px] bg-[#FAFAF9] border border-gray-200 rounded-xl"
            />
          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4 md:px-8">

          <Button
            variant="outline"
            className="w-fit rounded-full"
            onClick={onClose}
          >
            {commonT("cancel")}
          </Button>

          <Button
            className="w-fit rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md transition hover:shadow-lg"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? t("creating") : t("startOrder")}
          </Button>

        </div>
      </div>
    </div>
  );
}
