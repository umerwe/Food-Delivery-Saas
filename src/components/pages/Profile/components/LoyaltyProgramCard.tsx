"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, Coins, Gift, Loader2, RefreshCcw, Sparkles, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { CARD_PANEL_CLASS } from "@/components/common/common-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useLoyalty } from "@/hooks/useLoyalty";
import { getApiErrorMessage } from "@/lib/errors";
import { DEFAULT_DISPLAY_CURRENCY, formatMoney } from "@/lib/money";
import type { LoyaltySummary, LoyaltyTransaction } from "@/services/loyalty";

type LoyaltyProgramCardProps = {
  onWalletRedeemed?: () => void;
};

const formatPoints = (value: number) => new Intl.NumberFormat("en-US").format(Math.max(0, Math.round(value)));

const formatCurrency = (value: number, currency = DEFAULT_DISPLAY_CURRENCY) =>
  formatMoney(Math.max(0, value), currency, { maximumFractionDigits: 2 });

const formatDate = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getTransactionIcon = (transaction: LoyaltyTransaction) => {
  if (transaction.points < 0 || String(transaction.type).toUpperCase() === "REDEEM") {
    return ArrowDownLeft;
  }

  return ArrowUpRight;
};

const getTransactionTypeKey = (type: string) => {
  const normalizedType = String(type || "").toUpperCase();

  if (normalizedType === "EARN") return "earn";
  if (normalizedType === "REDEEM") return "redeem";
  if (normalizedType === "RESTORE") return "restore";
  if (normalizedType === "ADJUSTMENT") return "adjustment";
  if (normalizedType === "EXPIRE") return "expire";

  return "unknown";
};

export function LoyaltyProgramCard({ onWalletRedeemed }: LoyaltyProgramCardProps) {
  const t = useTranslations("profile.loyalty");
  const { token } = useAuth();
  const { fetchLoyalty, redeemToWallet } = useLoyalty(token);
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [points, setPoints] = useState("");

  const loadLoyalty = useCallback(async () => {
    if (!token) {
      setLoyalty(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { response, loyalty: nextLoyalty } = await fetchLoyalty();

      if (response?.error) {
        toast.error(getApiErrorMessage(response, t("failedLoad")));
        setLoyalty(null);
        return;
      }

      setLoyalty(nextLoyalty);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failedLoad"));
      setLoyalty(null);
    } finally {
      setLoading(false);
    }
  }, [fetchLoyalty, t, token]);

  useEffect(() => {
    void loadLoyalty();
  }, [loadLoyalty]);

  const redeemablePoints = useMemo(() => {
    const parsed = Number(points);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  }, [points]);

  const estimatedWalletValue = redeemablePoints * (loyalty?.redemptionValuePerPoint ?? 0);
  const canRedeem =
    Boolean(loyalty) &&
    redeemablePoints >= (loyalty?.minimumRedeemPoints ?? 0) &&
    redeemablePoints <= (loyalty?.availablePoints ?? 0);

  const handleRedeem = async () => {
    if (!loyalty) return;

    if (redeemablePoints < loyalty.minimumRedeemPoints) {
      toast.error(t("minimumRedeemError", { points: loyalty.minimumRedeemPoints }));
      return;
    }

    if (redeemablePoints > loyalty.availablePoints) {
      toast.error(t("insufficientPoints"));
      return;
    }

    try {
      setRedeeming(true);
      const { response, redemption } = await redeemToWallet(redeemablePoints);

      if (response?.error) {
        toast.error(getApiErrorMessage(response, t("redeemFailed")));
        return;
      }

      toast.success(
        t("redeemedSuccess", {
          amount: formatCurrency(redemption?.redeemedAmount ?? estimatedWalletValue, redemption?.currency ?? DEFAULT_DISPLAY_CURRENCY),
        })
      );
      setPoints("");
      await loadLoyalty();
      window.dispatchEvent(new Event("wallet-updated"));
      onWalletRedeemed?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("redeemFailed"));
    } finally {
      setRedeeming(false);
    }
  };

  const recentHistory = loyalty?.history.slice(0, 5) ?? [];

  return (
    <section className={CARD_PANEL_CLASS}>
      <div>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                {t("eyebrow")}
              </p>
              <h3 className="mt-1 text-[22px] font-medium leading-tight text-[#222] md:text-[26px]">
                {t("title")}
              </h3>
              <p className="mt-3 max-w-[620px] text-sm font-normal leading-6 text-[#8A8A8A] md:mt-4">
                {t("description")}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => void loadLoyalty()}
            disabled={loading}
            className="h-10 rounded-full bg-[#1A1C1C] px-4 font-medium text-white hover:bg-[#1A1C1C]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {t("refresh")}
          </Button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <MetricCard
            icon={<Trophy size={18} />}
            label={t("availablePoints")}
            value={loading ? t("loading") : formatPoints(loyalty?.availablePoints ?? 0)}
          />
          <MetricCard
            icon={<ArrowUpRight size={18} />}
            label={t("earnedPoints")}
            value={loading ? t("loading") : formatPoints(loyalty?.earnedPoints ?? 0)}
          />
          <MetricCard
            icon={<Gift size={18} />}
            label={t("redeemedPoints")}
            value={loading ? t("loading") : formatPoints(loyalty?.redeemedPoints ?? 0)}
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl bg-[#FAFAFA] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Coins size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#222]">{t("convertTitle")}</p>
                <p className="mt-1 text-xs leading-5 text-[#8A8A8A]">
                  {t("convertDescription", {
                    minimum: formatPoints(loyalty?.minimumRedeemPoints ?? 0),
                    value: formatCurrency(loyalty?.redemptionValuePerPoint ?? 0),
                  })}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input
                type="number"
                min={0}
                value={points}
                onChange={(event) => setPoints(event.target.value)}
                placeholder={t("pointsPlaceholder")}
                className="h-11 rounded-full border-0 bg-white text-[#222] shadow-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Button
                type="button"
                onClick={handleRedeem}
                disabled={loading || redeeming || !canRedeem}
                className="h-11 rounded-full bg-primary px-6 font-semibold text-white hover:bg-primary/90"
              >
                {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {redeeming ? t("redeeming") : t("redeem")}
              </Button>
            </div>

            {redeemablePoints > 0 ? (
              <p className="mt-3 text-xs font-medium text-[#303030]">
                {t("estimatedWalletCredit", { amount: formatCurrency(estimatedWalletValue) })}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl bg-[#FAFAFA] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#222]">{t("recentActivity")}</p>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                {t("historyCount", { count: loyalty?.history.length ?? 0 })}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="text-sm text-[#8A8A8A]">{t("loading")}</p>
              ) : recentHistory.length ? (
                recentHistory.map((transaction) => (
                  <HistoryRow key={transaction.id} transaction={transaction} />
                ))
              ) : (
                <p className="rounded-2xl bg-white p-4 text-sm text-[#8A8A8A]">
                  {t("emptyHistory")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A9A9A]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#222]">{value}</p>
    </div>
  );
}

function HistoryRow({ transaction }: { transaction: LoyaltyTransaction }) {
  const t = useTranslations("profile.loyalty");
  const Icon = getTransactionIcon(transaction);
  const isDebit = transaction.points < 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        isDebit ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
      }`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#222]">
          {transaction.note || t(`types.${getTransactionTypeKey(transaction.type)}`)}
        </p>
        <p className="mt-0.5 text-xs text-[#8A8A8A]">{formatDate(transaction.createdAt)}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isDebit ? "text-amber-700" : "text-emerald-700"}`}>
          {transaction.points > 0 ? "+" : ""}
          {transaction.points}
        </p>
        <p className="mt-0.5 text-[11px] text-[#9A9A9A]">
          {t("balanceAfter", { points: formatPoints(transaction.balanceAfter) })}
        </p>
      </div>
    </div>
  );
}
