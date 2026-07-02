"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AuthBranch } from "@/types/auth";
import { getBranchHoursSummary } from "@/components/pages/Items/utils/restaurant-card-utils";
import type { HomeBranch, LandingPopup } from "@/types/home";

const DISMISSED_POPUP_KEY = "deliveryway.dismissedLandingPopup";

type LandingPopupType = NonNullable<LandingPopup["type"]>;

type BranchOpeningHoursPopupProps = {
  popup?: LandingPopup | null;
  branch?: HomeBranch | AuthBranch | null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
};

const formatPeriod = (
  popup: LandingPopup | null | undefined,
  t: (key: "until" | "from", values: { date: string }) => string
) => {
  const from =
    popup?.period?.fromDate || popup?.temporaryClosure?.closedAt || null;

  const to =
    popup?.period?.toDate || popup?.temporaryClosure?.closedUntil || null;

  const formattedFrom = formatDateTime(from);
  const formattedTo = formatDateTime(to);

  if (formattedFrom && formattedTo) {
    return `${formattedFrom} - ${formattedTo}`;
  }

  if (formattedTo) {
    return t("until", { date: formattedTo });
  }

  if (formattedFrom) {
    return t("from", { date: formattedFrom });
  }

  return "";
};

const getPopupLabel = (
  type: LandingPopupType | undefined,
  t: (key: "temporaryUnavailable" | "vacationSchedule" | "holidaySchedule" | "importantUpdate") => string
) => {
  const normalized = String(type || "").toUpperCase();

  if (
    normalized.includes("TEMPORARY") ||
    normalized.includes("CLOSURE") ||
    normalized.includes("CLOSED")
  ) {
    return t("temporaryUnavailable");
  }

  if (normalized.includes("VACATION")) {
    return t("vacationSchedule");
  }

  if (normalized.includes("HOLIDAY")) {
    return t("holidaySchedule");
  }

  return t("importantUpdate");
};

const getPopupKey = (popup?: LandingPopup | null, branchId?: string) => {
  return [
    branchId || "",
    popup?.type || "",
    popup?.period?.fromDate || popup?.temporaryClosure?.closedAt || "",
    popup?.period?.toDate || popup?.temporaryClosure?.closedUntil || "",
    new Date().toDateString(),
  ].join("|");
};

type RuntimeClosedPopupTranslator = (key: "closedTitle" | "closedBeforeOpen" | "closedDuringBreak" | "closedAfterHours" | "closedTemporarily" | "closedGeneric", values?: { time?: string }) => string;

export const buildRuntimeClosedPopup = ({
  branch,
  t,
}: {
  branch?: HomeBranch | AuthBranch | null;
  t: RuntimeClosedPopupTranslator;
}): LandingPopup | null => {
  if (!branch) return null;

  const summary = getBranchHoursSummary(branch);
  const branchRecord = branch as { isOpen?: boolean | null };
  const activeSummary = summary.opening.status === "closed"
    ? summary.opening
    : summary.delivery.status === "closed"
      ? summary.delivery
      : summary.opening;
  const isApiClosed = branchRecord.isOpen === false;

  if (activeSummary.status !== "closed" && !isApiClosed) return null;

  const reason = activeSummary.status === "closed"
    ? activeSummary.reason || "closed"
    : "api-closed";
  const time = activeSummary.opensAt || activeSummary.breakUntil || "";
  const message = (() => {
    if (reason === "before-open" && time) return t("closedBeforeOpen", { time });
    if (reason === "break" && time) return t("closedDuringBreak", { time });
    if (reason === "after-close") return t("closedAfterHours");
    if (reason === "temporary-closure") return t("closedTemporarily");

    return t("closedGeneric");
  })();

  return {
    show: true,
    type: ["BRANCH_CLOSED", reason, time].filter(Boolean).join("_"),
    title: t("closedTitle"),
    message,
  };
};

const readDismissedPopupKey = () => {
  if (typeof window === "undefined") return "";

  try {
    return window.sessionStorage.getItem(DISMISSED_POPUP_KEY) || "";
  } catch {
    return "";
  }
};

const writeDismissedPopupKey = (value: string) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(DISMISSED_POPUP_KEY, value);
  } catch {
  }
};

export default function BranchOpeningHoursPopup({
  popup,
  branch,
}: BranchOpeningHoursPopupProps) {
  const t = useTranslations("home.branchOpeningHours");
  const branchId = String(branch?.id || "");

  const resolvedPopup = useMemo(
    () => popup?.show ? popup : buildRuntimeClosedPopup({ branch, t }),
    [branch, popup, t]
  );

  const popupKey = useMemo(
    () => getPopupKey(resolvedPopup, branchId),
    [resolvedPopup, branchId]
  );

  const [dismissedKey, setDismissedKey] = useState(readDismissedPopupKey);

  const shouldShow = Boolean(resolvedPopup?.show) && dismissedKey !== popupKey;

  const periodLabel = formatPeriod(resolvedPopup, t);
  const label = getPopupLabel(resolvedPopup?.type, t);

  const title = resolvedPopup?.title || t("scheduleUpdate");

  const message =
    resolvedPopup?.message ||
    resolvedPopup?.temporaryClosure?.message ||
    t("defaultMessage");

  const reason = resolvedPopup?.temporaryClosure?.reason;
  const branchName = branch?.name || t("selectedBranch");

  const handleDismiss = () => {
    setDismissedKey(popupKey);
    writeDismissedPopupKey(popupKey);
  };

  if (!shouldShow) return null;

  return (
    <Dialog
      open={shouldShow}
      onOpenChange={() => {
        // Keep the notice controlled by the explicit close/actions only.
        // On live, competing modal/focus transitions can emit a transient
        // close event right after mount, which dismissed the closed-branch
        // popup before users could read it.
      }}
    >
      <DialogContent
        className="flex max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-[620px] flex-col overflow-hidden rounded-[30px] border-border bg-card p-0 shadow-2xl sm:max-h-[calc(100dvh-40px)]"
        showCloseButton={false}
      >
        <div className="relative shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_32%),linear-gradient(135deg,var(--primary),rgba(17,24,39,0.96))]" />

          <div className="relative px-5 pb-7 pt-5 text-primary-foreground sm:px-8 sm:pb-8 sm:pt-8">
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 sm:right-5 sm:top-5"
              aria-label={t("closeNotice")}
            >
              <X size={18} />
            </button>

            <DialogHeader className="pr-10 text-left sm:pr-12">
              <div className="mb-4 flex max-w-full items-center gap-2 self-start rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur sm:mb-5 sm:text-xs">
                <Sparkles size={13} className="shrink-0" />
                <span className="min-w-0 truncate">{label}</span>
              </div>

              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur sm:h-14 sm:w-14">
                  <AlertTriangle size={26} />
                </div>

                <div className="min-w-0 flex-1">
                  <DialogTitle className="break-words text-[23px] font-bold leading-tight tracking-tight text-white sm:text-[32px]">
                    {title}
                  </DialogTitle>

                  <p className="mt-3 max-w-full break-words text-sm leading-6 text-white/85">
                    {message}
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          <div className="grid gap-3">
            <InfoCard
              icon={<MapPin size={18} />}
              label={t("branch")}
              value={branchName}
            />

            {periodLabel ? (
              <InfoCard
                icon={<Clock size={18} />}
                label={t("affectedPeriod")}
                value={periodLabel}
              />
            ) : null}

            {reason ? (
              <InfoCard
                icon={<CalendarDays size={18} />}
                label={t("reason")}
                value={reason}
              />
            ) : null}
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-muted/50 p-4 sm:mt-6">
            <p className="break-words text-sm leading-6 text-muted-foreground">
              {t("browseNotice")}
            </p>
          </div>
        </div>

        <div className="shrink-0 bg-card px-5 py-4 sm:px-8 sm:py-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={handleDismiss}
              className="h-12 min-w-0 flex-1 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
            >
              {t("understand")}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleDismiss();

                if (typeof window !== "undefined") {
                  window.location.hash = "categories";
                }
              }}
              className="h-12 min-w-0 flex-1 rounded-full border-primary/20 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary"
            >
              {t("browseMenu")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type InfoCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-primary/10 bg-primary/5 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 min-w-0 overflow-wrap-anywhere break-words text-sm font-semibold leading-5 text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
