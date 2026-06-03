"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { useAuth } from "@/hooks/useAuth";
import { BranchSelect } from "@/components/ui/BranchSelect";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { setStoredGroupOrderCode } from "@/lib/group-order";
import type { CreateGroupOrderPayload, GroupOrderType } from "@/types/group-order";
import type { BranchRecord } from "@/types/branch-selector";

type GroupOrderModalProps = { open: boolean; onClose: () => void };

export default function GroupOrderModal({ open, onClose }: GroupOrderModalProps) {
  const t = useTranslations("groupOrder.modal");
  const commonT = useTranslations("common");
  const errorT = useTranslations("errors");
  const { user, token } = useAuth();
  const { createGroupOrder, loading } = useGroupOrderApi(token);
const router = useRouter();
  const [selectedBranch, setSelectedBranch] = useState<BranchRecord | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [orderType, setOrderType] = useState<GroupOrderType>("DINE_IN");

  if (!open) return null;

  const handleSubmit = async () => {
  try {
    const branchId = user?.branchId || selectedBranch?.id;

    if (!branchId) return toast.error(t("selectBranch"));
    if (!date || !time) return toast.error(t("selectDateTime"));

    const orderTime = new Date(`${date}T${time}`).toISOString();

    const payload: CreateGroupOrderPayload = {
      branchId,
      orderType,
      deliveryAddressId: null,
      orderTime,
      hostNote: note || null,
    };

    const res = await createGroupOrder({ payload });

    if (!res || res.error) {
      return toast.error(res?.error || t("failedCreate"));
    }

const dataRecord = typeof res?.data === "object" && res.data !== null ? res.data as Record<string, unknown> : null;
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">

      <div className="relative w-full max-w-lg bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 p-6 md:p-8">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {t("title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("description")}
          </p>
        </div>

        <div className="space-y-5">

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

          {/* DATE + TIME */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">{t("date")}</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 h-12 rounded-full bg-[#FAFAF9] border border-gray-200"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">{t("time")}</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 h-12 rounded-full bg-[#FAFAF9] border border-gray-200"
              />
            </div>
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

          {/* ACTIONS */}
          <div className="flex gap-3 pt-2 justify-end">

            <Button
              variant="outline"
              className="w-fit rounded-full"
              onClick={onClose}
            >
              {commonT("cancel")}
            </Button>

            <Button
              className="w-fit rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md hover:shadow-lg transition"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? t("creating") : t("startOrder")}
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
}
