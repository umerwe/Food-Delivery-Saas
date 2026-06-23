"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CalendarDays, CircleCheck, Clock, Coffee, Info } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type OpeningHoursDialogRow = {
  id: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  isClosed: boolean;
  hoursLabel?: string;
  breakLabels?: string[];
  closedTitle: string;
  closedDescription: string;
  breakPrefix: string;
};

type OpeningHoursDialogSection = {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  rows: OpeningHoursDialogRow[];
  emptyTitle: string;
};

type OpeningHoursDialogProps = {
  triggerLabel: string;
  badgeLabel: string;
  title: string;
  description?: string;
  branchPill?: string;
  stats: Array<{
    label: string;
    value: number | string;
  }>;
  infoTitle?: string;
  infoDescription?: string;
  sections: OpeningHoursDialogSection[];
  closeLabel: string;
  triggerClassName?: string;
  triggerContent?: ReactNode;
};

export function OpeningHoursDialog({
  triggerLabel,
  badgeLabel,
  title,
  description,
  branchPill,
  stats,
  infoTitle,
  infoDescription,
  sections,
  closeLabel,
  triggerClassName,
  triggerContent,
}: OpeningHoursDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          className={triggerClassName ?? "inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"}
        >
          {triggerContent ?? <Info size={16} />}
        </button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-24px)] max-w-[960px] flex-col gap-0 overflow-hidden rounded-[24px] border-0 bg-white p-0 shadow-2xl sm:w-[calc(100vw-48px)]">
        <div className="border-b border-gray-100 bg-gradient-to-br from-primary/10 via-white to-orange-50 px-5 py-5 sm:px-6">
          <DialogHeader className="pr-10 text-left">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-primary text-white shadow-lg shadow-primary/25">
                  <CalendarDays size={18} />
                </span>
                <div className="min-w-0">
                  <div className="mb-2 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/10">
                    {badgeLabel}
                  </div>
                  <DialogTitle className="text-[22px] font-semibold leading-tight tracking-tight text-gray-950 sm:text-[26px]">
                    {title}
                  </DialogTitle>
                  {description ? (
                    <DialogDescription className="mt-2 max-w-[560px] text-sm leading-6 text-gray-600">
                      {description}
                    </DialogDescription>
                  ) : null}
                </div>
              </div>

              {branchPill ? (
                <span className="w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-100">
                  {branchPill}
                </span>
              ) : null}
            </div>
          </DialogHeader>

          {stats.length > 0 ? (
            <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-[440px] sm:gap-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[16px] bg-white/90 px-3 py-3 text-center shadow-sm ring-1 ring-gray-100 backdrop-blur"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:text-[11px]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] px-5 py-5 sm:px-6">
          {infoTitle || infoDescription ? (
            <div className="mb-5 rounded-[18px] border border-blue-100 bg-blue-50/80 p-4">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-blue-600 shadow-sm">
                  <Info size={16} />
                </span>
                <div className="min-w-0">
                  {infoTitle ? (
                    <p className="text-sm font-semibold text-gray-900">{infoTitle}</p>
                  ) : null}
                  {infoDescription ? (
                    <p className="mt-1 text-xs leading-5 text-gray-600">{infoDescription}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-5">
            {sections.map((section) => {
              const SectionIcon = section.icon;

              return (
                <section key={section.id}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-primary shadow-sm">
                        <SectionIcon size={16} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold leading-6 text-gray-950">{section.title}</h3>
                        {section.description ? (
                          <p className="mt-0.5 text-sm leading-5 text-gray-500">{section.description}</p>
                        ) : null}
                      </div>
                    </div>
                    <CircleCheck size={18} className="mt-1 shrink-0 text-emerald-600" />
                  </div>

                  {section.rows.length > 0 ? (
                    <div className="space-y-3">
                      {section.rows.map((row, index) => (
                        <div
                          key={row.id}
                          className="overflow-visible rounded-[22px] border border-gray-100 bg-white shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-sm font-semibold text-primary">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-950">{row.title}</p>
                                <p className="text-xs text-gray-500">{row.subtitle}</p>
                              </div>
                            </div>

                            <span className="rounded-full bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-100">
                              {row.statusLabel}
                            </span>
                          </div>

                          <div className="p-4">
                            {row.isClosed ? (
                              <div className="flex min-h-[76px] flex-col justify-center rounded-[16px] border border-red-100 bg-red-50 px-4">
                                <p className="text-sm font-semibold text-red-700">{row.closedTitle}</p>
                                <p className="mt-1 text-xs leading-5 text-red-500">{row.closedDescription}</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex h-[44px] items-center gap-3 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-sm text-gray-800">
                                  <Clock size={16} className="shrink-0 text-gray-400" />
                                  <span className="font-medium">{row.hoursLabel}</span>
                                </div>

                                {row.breakLabels && row.breakLabels.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {row.breakLabels.map((breakLabel) => (
                                      <div
                                        key={`${row.id}-${breakLabel}`}
                                        className="inline-flex items-center gap-2 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 py-2 text-xs font-medium text-gray-700"
                                      >
                                        <Coffee size={13} className="shrink-0 text-gray-400" />
                                        <span>{`${row.breakPrefix} ${breakLabel}`}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="min-h-[260px] rounded-[22px] border border-dashed border-gray-200 bg-white p-6 text-center sm:p-8">
                      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                        <CalendarDays size={18} />
                      </span>
                      <p className="mt-4 text-sm font-semibold text-gray-900">{section.emptyTitle}</p>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        <DialogFooter className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
          <DialogClose className="inline-flex h-[44px] items-center justify-center rounded-[14px] border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20">
            {closeLabel}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
