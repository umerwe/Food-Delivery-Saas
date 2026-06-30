"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Time24Picker } from "@/components/ui/time-24-picker";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { useAuth } from "@/hooks/useAuth";
import { useCheckout } from "@/hooks/useCheckout";
import { BranchSelect } from "@/components/ui/BranchSelect";
import { CalendarDays, Clock3, Loader2, MapPin, PencilLine, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { resolveGroupOrderDeliveryAddressId, setStoredGroupOrderCode } from "@/lib/group-order";
import { formatDisplayAddress } from "@/lib/address-display";
import { getBackendErrorMessage, hasBackendError } from "@/components/pages/Checkout/utils/checkout-normalizers";
import { fetchAddresses as fetchProfileAddresses, type AddressRecord } from "@/services/profile";
import type { CreateGroupOrderPayload, GroupOrderType } from "@/types/group-order";
import type { BranchRecord } from "@/types/branch-selector";

type GroupOrderModalProps = { open: boolean; onClose: () => void };

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

const isPastDateValue = (value: string) => Boolean(value) && value < getCurrentSchedule().date;

export function GroupOrderModal({ open, onClose }: GroupOrderModalProps) {
  const t = useTranslations("groupOrder.modal");
  const commonT = useTranslations("common");
  const errorT = useTranslations("errors");
  const { user, token } = useAuth();
  const { createGroupOrder, loading } = useGroupOrderApi(token);
  const { get } = useCheckout(token);
  const router = useRouter();
  const initialSchedule = useMemo(() => getCurrentSchedule(), []);
  const [selectedBranch, setSelectedBranch] = useState<BranchRecord | null>(null);
  const [date, setDate] = useState(initialSchedule.date);
  const [time, setTime] = useState(initialSchedule.time);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [note, setNote] = useState("");
  const [orderType, setOrderType] = useState<GroupOrderType>("DINE_IN");
  const [deliveryAddresses, setDeliveryAddresses] = useState<AddressRecord[]>([]);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState("");
  const [loadingDeliveryAddresses, setLoadingDeliveryAddresses] = useState(false);
  const todayDate = getCurrentSchedule().date;

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
    setTime(currentSchedule.time);
    setScheduleEditorOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open || orderType !== "DELIVERY") return;

    void loadDeliveryAddresses();
  }, [loadDeliveryAddresses, open, orderType]);

  const selectedScheduleDate = useMemo(
    () => getLocalScheduleDate(date, time),
    [date, time]
  );

  const selectedScheduleLabel = selectedScheduleDate
      ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
        hourCycle: "h23",
      }).format(selectedScheduleDate)
    : t("selectDateTime");

  const resetScheduleToNow = () => {
    const currentSchedule = getCurrentSchedule();
    setDate(currentSchedule.date);
    setTime(currentSchedule.time);
  };

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      const branchId = user?.branchId || selectedBranch?.id;

      if (!branchId) return toast.error(t("selectBranch"));
      if (!date || !time || !selectedScheduleDate) {
        return toast.error(t("selectDateTime"));
      }

      if (isPastDateValue(date)) {
        return toast.error(errorT("reservationPastDate"));
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

      const orderTime = selectedScheduleDate.toISOString();
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {t("scheduleTitle")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {t("scheduleSubtitle")}
                  </p>
                  <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm">
                    <Clock3 className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{selectedScheduleLabel}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setScheduleEditorOpen((current) => !current)}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary/30 hover:text-primary"
              >
                <PencilLine className="h-4 w-4" />
                {t("editSchedule")}
              </button>
            </div>

            {scheduleEditorOpen ? (
              <div className="mt-4 rounded-[18px] border border-white bg-white p-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm text-gray-600">{t("date")}</label>
                    <Input
                      type="date"
                      value={date}
                      min={todayDate}
                      onChange={(e) => {
                        const nextDate = e.target.value;

                        if (isPastDateValue(nextDate)) {
                          toast.error(errorT("reservationPastDate"));
                          setDate(todayDate);
                          return;
                        }

                        setDate(nextDate);
                      }}
                      className="mt-1 h-12 rounded-full border border-gray-200 bg-[#FAFAF9]"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">{t("time")}</label>
                    <Time24Picker
                      value={time}
                      onChange={setTime}
                      className="mt-1 h-12 rounded-full border border-gray-200 bg-[#FAFAF9] px-4 text-sm font-medium text-gray-700"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetScheduleToNow}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-600 transition hover:bg-primary/10 hover:text-primary"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("resetToNow")}
                </button>
              </div>
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
