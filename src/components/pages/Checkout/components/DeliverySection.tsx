'use client';
import { useEffect, useMemo } from 'react';
import { Clock, PauseCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { DeliveryAddressSection } from '@/components/pages/Checkout/components/DeliveryAddressSection';
import NotesSection from '@/components/pages/Checkout/components/NotesSection';
import { CustomerDetailsForm } from '@/components/pages/Checkout/components/CustomerDetailsForm';
import { PaymentMethodSection } from '@/components/pages/Checkout/components/PaymentMethodSection';
import {
  buildScheduledDeliveryEstimate,
  buildScheduleBreakLabels,
  buildDeliveryTimeSlots,
  formatPickupTimeLabel,
  getBranchScheduleForDate,
  getDateFromValue,
  getDateValue,
  isPastDateValue,
} from '@/components/pages/Checkout/utils/pickup-schedule';
import type { BranchRecord } from '@/types/branch-selector';
import type { CheckoutAddressValues } from '@/validations/checkout';

type DeliverySectionProps = {
  selectedAddress: string | null;
  setSelectedAddress: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  customer: { name: string; phone: string; email: string };
  setCustomer: (value: { name: string; phone: string; email: string }) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  scheduledDeliveryValue: string;
  setScheduledDeliveryValue: (value: string) => void;
  selectedBranch?: BranchRecord | null;
  isGuest?: boolean;
  privacyPolicyAccepted?: boolean;
  setPrivacyPolicyAccepted?: (value: boolean) => void;
  privacyPolicy?: {
    title: string;
    content: string;
    policyLink: string;
  } | null;
  privacyPolicyLoading?: boolean;
  guestDeliveryAddress: CheckoutAddressValues;
  setGuestDeliveryAddress: (value: CheckoutAddressValues) => void;
  totalPreparationMinutes?: number;
};

const buildUpcomingDates = () => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);

    date.setDate(today.getDate() + index);

    return date;
  });
};

const getScheduledDateValue = (value: string) => value.split("T")[0] || "";

export function DeliverySection(props: DeliverySectionProps) {
  const t = useTranslations("checkout");
  const { setScheduledDeliveryValue } = props;
  const selectedDateValue = getScheduledDateValue(props.scheduledDeliveryValue);
  const dates = useMemo(() => buildUpcomingDates(), []);
  const timeSlots = useMemo(
    () => buildDeliveryTimeSlots({
      branch: props.selectedBranch,
      dateValue: selectedDateValue,
    }),
    [props.selectedBranch, selectedDateValue]
  );
  const scheduleState = useMemo(
    () => getBranchScheduleForDate({
      branch: props.selectedBranch,
      dateValue: selectedDateValue,
      scheduleType: "delivery",
    }),
    [props.selectedBranch, selectedDateValue]
  );
  const schedule = scheduleState.schedule;
  const breakLabels = useMemo(() => buildScheduleBreakLabels(schedule), [schedule]);
  const deliveryEstimate = useMemo(
    () => buildScheduledDeliveryEstimate({
      scheduledDeliveryValue: props.scheduledDeliveryValue,
      preparationMinutes: props.totalPreparationMinutes ?? 0,
    }),
    [props.scheduledDeliveryValue, props.totalPreparationMinutes]
  );
  const scheduleLabel = useMemo(() => {
    if (!selectedDateValue || !schedule) return "";
    if (schedule.isClosed) return t("closed");

    return `${formatPickupTimeLabel(schedule.openTime || "")} - ${formatPickupTimeLabel(
      schedule.closeTime || ""
    )}`;
  }, [schedule, selectedDateValue, t]);

  useEffect(() => {
    if (selectedDateValue && isPastDateValue(selectedDateValue)) {
      setScheduledDeliveryValue("");
    }
  }, [selectedDateValue, setScheduledDeliveryValue]);

  return (
    <div className="space-y-[38px]">
      <DeliveryAddressSection {...props} />
      <section>
        <h2 className="mb-[26px] text-[24px] font-semibold text-gray-900">
          {t("scheduledDelivery")}
        </h2>
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {dates.map((date) => {
              const nextDateValue = getDateValue(date);
              const dateScheduleState = getBranchScheduleForDate({
                branch: props.selectedBranch,
                dateValue: nextDateValue,
                scheduleType: "delivery",
              });
              const availableSlots = buildDeliveryTimeSlots({
                branch: props.selectedBranch,
                dateValue: nextDateValue,
              });
              const disabled =
                isPastDateValue(nextDateValue) ||
                (dateScheduleState.hasOpeningHours &&
                  (Boolean(dateScheduleState.schedule?.isClosed) ||
                    availableSlots.length === 0));
              const isSelected = selectedDateValue === nextDateValue;

              return (
                <button
                  key={nextDateValue}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const nextDate = getDateFromValue(nextDateValue);
                    props.setScheduledDeliveryValue(nextDate ? `${nextDateValue}T` : "");
                  }}
                  className={`rounded-xl border px-3 py-3 text-left transition-all ${
                    isSelected
                      ? "border-orange-500 bg-orange-500 text-white shadow-md"
                      : disabled
                        ? "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400"
                        : "border-gray-200 bg-white text-gray-700 hover:border-orange-400 hover:text-orange-500"
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
          </div>

          {selectedDateValue && scheduleLabel ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Clock size={14} />
              {t("deliveryHoursForDate", { hours: scheduleLabel })}
              {scheduleState.source === "opening" ? ` ${t("usingOpeningHours")}` : ""}
            </p>
          ) : selectedDateValue && !scheduleState.hasOpeningHours ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Clock size={14} />
              {t("deliveryHoursNotConfigured")}
            </p>
          ) : null}

          {selectedDateValue && breakLabels.length > 0 ? (
            <div className="mt-3 rounded-[18px] border border-orange-100 bg-orange-50/80 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-orange-600 shadow-sm">
                  <PauseCircle size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {t("deliveryBreakHoursTitle")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    {t("deliveryBreakHoursDescription")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {breakLabels.map((breakLabel) => (
                      <span
                        key={`${breakLabel.label}-${breakLabel.note || ""}`}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm ring-1 ring-orange-100"
                      >
                        {t("deliveryBreakTime", { time: breakLabel.label })}
                        {breakLabel.note ? ` · ${breakLabel.note}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {deliveryEstimate ? (
            <div className="mt-3 rounded-[18px] border border-primary/10 bg-primary/5 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-primary shadow-sm ring-1 ring-primary/10">
                  <Clock size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {t("scheduledDeliveryEstimateTitle", {
                      time: deliveryEstimate.readyLabel,
                    })}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    {t("scheduledDeliveryEstimateDescription", {
                      selectedTime: deliveryEstimate.selectedLabel,
                      minutes: deliveryEstimate.preparationMinutes,
                      deliveryTime: deliveryEstimate.readyLabel,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {selectedDateValue ? (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {scheduleState.hasOpeningHours ? (
                timeSlots.length > 0 ? (
                  timeSlots.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() =>
                        props.setScheduledDeliveryValue(`${selectedDateValue}T${slot.value}`)
                      }
                      className={`h-[48px] rounded-[10px] border-2 text-sm font-medium transition-all ${
                        props.scheduledDeliveryValue === `${selectedDateValue}T${slot.value}`
                          ? "border-orange-500 bg-orange-500 text-white shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-orange-400 hover:text-orange-500"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))
                ) : (
                  <p className="col-span-full rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    {t("noDeliverySlots")}
                  </p>
                )
              ) : (
                <label className="col-span-full block max-w-[220px]">
                  <span className="sr-only">{t("deliveryTime")}</span>
                  <input
                    type="time"
                    value={props.scheduledDeliveryValue.split("T")[1] || ""}
                    onChange={(event) =>
                      props.setScheduledDeliveryValue(
                        event.target.value ? `${selectedDateValue}T${event.target.value}` : `${selectedDateValue}T`
                      )
                    }
                    className="h-[48px] w-full rounded-[10px] border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                </label>
              )}
            </div>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {t("scheduledDeliveryOptional")}
        </p>
      </section>
      <NotesSection note={props.note} setNote={props.setNote} />
      <CustomerDetailsForm {...props} editable={props.isGuest} />
      <PaymentMethodSection
        {...props}
        allowCashOnDelivery={false}
        allowCardOnDelivery
      />
    </div>
  );
}
