"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import usePayments from "@/hooks/usePayments";
import type { PaymentItem, PaymentMeta, WalletItem } from "@/services/payments";
import { Button } from "@/components/ui/button";
import { PaginationSection } from "@/components/ui/PaginationComponent";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import Balance from "./Balance";
import { useTranslations } from "next-intl";
import { DEFAULT_DISPLAY_CURRENCY, formatMoney } from "@/lib/money";

export default function PaymentsHistory() {
  const t = useTranslations("payments");
  const orderStatusT = useTranslations("orderStatus");
  const commonT = useTranslations("common");
  const { token, restaurantId } = useAuth();
  const { fetchPaymentsPage, fetchWallet: fetchWalletData } = usePayments(token);

  const [tab, setTab] = useState<"payments" | "wallet">("wallet");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [wallet, setWallet] = useState<WalletItem[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState(DEFAULT_DISPLAY_CURRENCY);

  const [meta, setMeta] = useState<PaymentMeta>({});
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(t);
  }, [search]);

  const fetchPayments = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status) params.set("status", status);
    if (restaurantId) params.set("restaurantId", restaurantId);

    const { response: res, payments: nextPayments, meta: nextMeta } = await fetchPaymentsPage({
      page,
      limit,
      search: debouncedSearch,
      status,
      restaurantId,
    });

    if (!res?.error) {
      setPayments(nextPayments);
      setMeta(nextMeta || {});
    }

    setLoading(false);
  };

  const fetchWallet = async () => {
    setLoading(true);

    const { response: res, wallet: nextWallet, balance, currency } = await fetchWalletData();

    if (!res?.error) {
      setWallet(nextWallet);
      setWalletBalance(balance);
      setWalletCurrency(currency);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (tab === "payments") fetchPayments();
    else fetchWallet();
  }, [tab, page, debouncedSearch, status, token]);

  useEffect(() => {
    const handler = () => fetchWallet();

    window.addEventListener("wallet-updated", handler);

    return () =>
      window.removeEventListener("wallet-updated", handler);
  }, []);

  const filteredWallet = useMemo(() => {
    let data = [...wallet];

    if (debouncedSearch) {
      data = data.filter((i) =>
        i.note?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    if (status) {
      data = data.filter((i) => i.type === status);
    }

    return data;
  }, [wallet, debouncedSearch, status]);

  const title =
    tab === "payments" ? t("paymentsHistory") : t("walletHistory");

  const subtitle =
    tab === "payments"
      ? t("paymentsSubtitle")
      : t("walletSubtitle");

  const mapPaymentStatus = (value: string) => {
    switch (value) {
      case "PAID":
        return t("status.paid");
      case "PENDING":
        return t("status.pending");
      case "FAILED":
        return t("status.failed");
      default:
        return value;
    }
  };

  const mapOrderStatus = (value?: string | null) => {
    switch (String(value || "").toUpperCase()) {
      case "PAID":
        return t("status.paid");
      case "PENDING":
        return t("status.pending");
      case "FAILED":
        return t("status.failed");
      case "PLACED":
        return orderStatusT("status.placed");
      case "CONFIRMED":
        return orderStatusT("status.confirmed");
      case "PREPARING":
        return orderStatusT("status.preparing");
      case "PICKED_UP":
        return orderStatusT("status.pickedUp");
      case "DELIVERED":
        return orderStatusT("status.delivered");
      case "CANCELLED":
        return orderStatusT("status.cancelled");
      default:
        return value || t("orderFallback");
    }
  };

  return (
    <section className="mx-auto w-full px-4 pb-[100px] pt-[20px] md:px-40">
      <div className="rounded-[28px] bg-[#FAFAFA] p-5 md:p-8">
        {/* HEADER */}
        <div className="mb-7">
          <h1 className="text-[34px] font-semibold text-[#171717]">
            {title}
          </h1>

          <p className="text-[14px] text-[#7C7C7C]">{subtitle}</p>
        </div>

        {/* BALANCE */}
        <Balance
          balance={walletBalance}
          currency={walletCurrency}
          loyaltyPoints={wallet.length || 0}
        />

        {/* TABS */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setTab("payments");
              setStatus("");
              setPage(1);
            }}
            className={`h-9 rounded-full px-4 text-[13px] ${
              tab === "payments"
                ? "text-white"
                : "border bg-white text-[#171717]"
            }`}
            style={
              tab === "payments"
                ? { background: "var(--primary)" }
                : {}
            }
          >
            {t("payments")}
          </Button>

          <Button
            onClick={() => {
              setTab("wallet");
              setStatus("");
              setPage(1);
            }}
            className={`h-9 rounded-full px-4 text-[13px] ${
              tab === "wallet"
                ? "text-white"
                : "border bg-white text-[#171717]"
            }`}
            style={
              tab === "wallet"
                ? { background: "#0F766E" }
                : {}
            }
          >
            {t("wallet")}
          </Button>
        </div>

        {/* FILTERS */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex w-full items-center gap-3 md:flex-1">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <Input
                placeholder={
                  tab === "payments"
                    ? t("searchByOrderId")
                    : t("searchWalletNote")
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-full border-none bg-[#F5F5F5] pl-10 pr-4 focus-visible:ring-0"
              />
            </div>

            <Button
              className="h-10 shrink-0 rounded-full bg-primary px-6 text-white"
              onClick={() => {
                setDebouncedSearch(search.trim());
                setPage(1);
              }}
            >
              {commonT("search")}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={status || "ALL"}
              onValueChange={(val) => {
                setStatus(val === "ALL" ? "" : val);
                setPage(1);
              }}
            >
              <SelectTrigger className="!h-10 min-w-[150px] rounded-full border-none bg-[#F5F5F5] px-4">
                <SelectValue placeholder={t("allStatus")} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">{t("all")}</SelectItem>

                {tab === "payments" ? (
                  <>
                    <SelectItem value="PAID">{t("paid")}</SelectItem>
                    <SelectItem value="PENDING">
                      {t("pending")}
                    </SelectItem>
                    <SelectItem value="FAILED">{t("failed")}</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="CREDIT">
                      {t("credit")}
                    </SelectItem>
                    <SelectItem value="DEBIT">{t("debit")}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {loading ? (
            <p className="py-10 text-center text-gray-400">
              {commonT("loading")}
            </p>
          ) : tab === "payments" ? (
            payments.length === 0 ? (
              <p className="py-10 text-center text-gray-400">
                {t("noPaymentsFound")}
              </p>
            ) : (
              payments.map((item) => {
                const date = new Date(item.createdAt);

                const statusStyles: Record<string, string> = {
                  PAID: "bg-green-50 text-green-700",
                  PENDING: "bg-amber-50 text-amber-700",
                  FAILED: "bg-red-50 text-red-700",
                };

                const methodStyles: Record<string, string> = {
                  COD: "bg-blue-50 text-blue-700",
                  STRIPE: "bg-violet-50 text-violet-700",
                  CARD: "bg-violet-50 text-violet-700",
                };

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* LEFT */}
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F5]">
                          <Clock
                            size={18}
                            className="text-zinc-500"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-[#171717]">
                              {item.paymentMethod} • {item.type}
                            </p>

                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                methodStyles[
                                  item.paymentMethod
                                ] ||
                                "bg-zinc-100 text-zinc-700"
                              }`}
                            >
                              {item.paymentMethod}
                            </span>
                          </div>

                          <p className="truncate text-xs text-gray-500">
                            {t("orderNumber", { id: item.orderId })}
                          </p>

                          <p className="mt-0.5 text-[11px] text-gray-400">
                            {date.toLocaleDateString()} •{" "}
                            {date.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hourCycle: "h23",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="shrink-0 text-right">
                        <p className="text-[22px] font-semibold leading-none text-primary">
                          {formatMoney(item.amount, item.currency || walletCurrency)}
                        </p>

                        <div className="mt-2 flex flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              statusStyles[item.status] ||
                              "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {mapPaymentStatus(item.status)}
                          </span>

                          <span className="text-[11px] text-gray-400">
                            {mapOrderStatus(item.order?.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : filteredWallet.length === 0 ? (
            <p className="py-10 text-center text-gray-400">
              {t("noWalletHistoryFound")}
            </p>
          ) : (
            filteredWallet.map((item) => {
              const isCredit = item.type === "CREDIT";

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isCredit
                          ? "bg-green-50"
                          : "bg-red-50"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft
                          size={18}
                          className="text-green-600"
                        />
                      ) : (
                        <ArrowUpRight
                          size={18}
                          className="text-red-600"
                        />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold">
                        {item.note}
                      </p>

                      <p className="text-xs text-gray-500">
                        {t("balanceAfter", {
                          amount: formatMoney(item.balanceAfter, walletCurrency),
                        })}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`font-semibold ${
                      isCredit
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {isCredit ? "+" : "-"} {formatMoney(item.amount, walletCurrency)}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINATION */}
        {tab === "payments" && (
          <div className="mt-10">
            <PaginationSection
              page={meta?.page || page}
              totalPages={meta?.totalPages || 1}
              total={meta?.total || 0}
              limit={limit}
              hasNext={Boolean(meta?.hasNext)}
              hasPrevious={Boolean(meta?.hasPrevious)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </section>
  );
}
