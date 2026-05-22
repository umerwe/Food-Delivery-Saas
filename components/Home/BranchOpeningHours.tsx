"use client";

import { useEffect, useMemo, useState } from "react";
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

type LandingPopupType =
  | "TEMPORARY_CLOSURE"
  | "HOLIDAY_CLOSURE"
  | "VACATION"
  | "CLOSED"
  | string;

type LandingPopup = {
  show?: boolean;
  type?: LandingPopupType;
  title?: string;
  message?: string;
  period?: {
    fromDate?: string | null;
    toDate?: string | null;
  } | null;
  temporaryClosure?: {
    isClosed?: boolean;
    closedAt?: string | null;
    closedUntil?: string | null;
    reason?: string | null;
    message?: string | null;
  } | null;
};

type BranchOpeningHoursPopupProps = {
  popup?: LandingPopup | null;
  branch?: any;
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
  });
};

const formatPeriod = (popup?: LandingPopup | null) => {
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
    return `Until ${formattedTo}`;
  }

  if (formattedFrom) {
    return `From ${formattedFrom}`;
  }

  return "";
};

const getPopupLabel = (type?: LandingPopupType) => {
  const normalized = String(type || "").toUpperCase();

  if (
    normalized.includes("TEMPORARY") ||
    normalized.includes("CLOSURE") ||
    normalized.includes("CLOSED")
  ) {
    return "Temporarily unavailable";
  }

  if (normalized.includes("VACATION")) {
    return "Vacation schedule";
  }

  if (normalized.includes("HOLIDAY")) {
    return "Holiday schedule";
  }

  return "Important branch update";
};

const getPopupKey = (popup?: LandingPopup | null, branchId?: string) => {
  return [
    branchId || "",
    popup?.type || "",
    popup?.title || "",
    popup?.message || popup?.temporaryClosure?.message || "",
    popup?.period?.fromDate || popup?.temporaryClosure?.closedAt || "",
    popup?.period?.toDate || popup?.temporaryClosure?.closedUntil || "",
  ].join("|");
};

export default function BranchOpeningHoursPopup({
  popup,
  branch,
}: BranchOpeningHoursPopupProps) {
  const branchId = String(branch?.id || "");

  const popupKey = useMemo(
    () => getPopupKey(popup, branchId),
    [popup, branchId]
  );

  const [dismissedKey, setDismissedKey] = useState("");

  useEffect(() => {
    setDismissedKey("");
  }, [popupKey]);

  const shouldShow = Boolean(popup?.show) && dismissedKey !== popupKey;

  const periodLabel = formatPeriod(popup);
  const label = getPopupLabel(popup?.type);

  const title = popup?.title || "Branch schedule update";

  const message =
    popup?.message ||
    popup?.temporaryClosure?.message ||
    "This branch has a schedule update. Please check the availability before placing your order.";

  const reason = popup?.temporaryClosure?.reason;
  const branchName = branch?.name || "Selected branch";

  const handleDismiss = () => {
    setDismissedKey(popupKey);
  };

  if (!shouldShow) return null;

  return (
    <Dialog
      open={shouldShow}
      onOpenChange={(open) => {
        if (!open) handleDismiss();
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
              aria-label="Close branch notice"
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
              label="Branch"
              value={branchName}
            />

            {periodLabel ? (
              <InfoCard
                icon={<Clock size={18} />}
                label="Affected period"
                value={periodLabel}
              />
            ) : null}

            {reason ? (
              <InfoCard
                icon={<CalendarDays size={18} />}
                label="Reason"
                value={reason}
              />
            ) : null}
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-muted/50 p-4 sm:mt-6">
            <p className="break-words text-sm leading-6 text-muted-foreground">
              You can still browse the menu, but ordering may be unavailable
              during this schedule window.
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
              I understand
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
              Browse menu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type InfoCardProps = {
  icon: React.ReactNode;
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
