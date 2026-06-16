"use client";

import Image from "next/image";
import { ArrowRight, BadgeCheck, CreditCard, Gift, Mail, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { GiftCardAvailableItem, HomeGiftCards } from "@/types/gift-cards";
import { GiftCardPurchaseModal } from "@/components/pages/Home/components/GiftCardPurchaseModal";

type GiftCardsSectionProps = {
  giftCards?: HomeGiftCards | null;
  restaurantId?: string | null;
  branchId?: string | null;
  currency?: string | null;
};

const formatAmount = (amount: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

type GiftCardTicketProps = {
  giftCard: GiftCardAvailableItem;
  currency?: string | null;
  onSelect: (giftCard: GiftCardAvailableItem) => void;
};

const GiftCardTicket = ({
  giftCard,
  currency,
  onSelect,
}: GiftCardTicketProps) => {
  const t = useTranslations("home.giftCards");

  return (
    <article className="group relative overflow-hidden rounded-[22px] bg-white shadow-[0_18px_55px_rgba(239,68,68,0.13)] transition duration-200 before:absolute before:inset-x-6 before:-top-10 before:h-20 before:rounded-full before:bg-primary/20 before:blur-3xl hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(239,68,68,0.2)]">
      <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition duration-200 group-hover:bg-primary/20" />
      <div className="relative flex min-h-[188px] min-w-0 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-2xl font-black leading-none text-gray-950">
              {formatAmount(giftCard.amount, currency ?? "USD")}
            </p>
            <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-gray-900">
              {giftCard.title}
            </h3>
          </div>

          {giftCard.imageUrl ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
              <Image
                src={giftCard.imageUrl}
                alt={giftCard.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10">
              <BadgeCheck size={22} />
            </span>
          )}
        </div>

        {giftCard.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-5 text-gray-500">
            {giftCard.description}
          </p>
        ) : null}

        <Button
          type="button"
          className="mt-auto h-10 rounded-full bg-primary text-white hover:bg-primary/90"
          onClick={() => onSelect(giftCard)}
        >
          {t("buyPreset")}
          <ArrowRight size={15} />
        </Button>
      </div>
    </article>
  );
};

export const GiftCardsSection = ({
  giftCards,
  restaurantId,
  branchId,
  currency,
}: GiftCardsSectionProps) => {
  const t = useTranslations("home.giftCards");
  const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCardAvailableItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const items = useMemo(() => giftCards?.items ?? [], [giftCards?.items]);

  if (giftCards?.isEnabled !== true || !restaurantId) {
    return null;
  }

  const openPurchaseModal = (giftCard?: GiftCardAvailableItem) => {
    setSelectedGiftCard(giftCard ?? null);
    setIsModalOpen(true);
  };

  return (
    <section
      id="gift-cards"
      className="mx-auto max-w-[1400px] px-4 pb-[30px] pt-[30px] sm:px-6 sm:pb-[60px] sm:pt-[60px]"
    >
      <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-xl shadow-primary/5">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[520px] bg-[#fbfbfb] p-6 sm:p-8 lg:p-10">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                <Gift size={14} />
                {t("label")}
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-gray-950 sm:text-4xl">
                {t("title")}
              </h2>
              <p className="mt-4 text-sm leading-6 text-gray-500 sm:text-base">
                {t("description")}
              </p>
            </div>

            <div className="relative mt-10 h-[230px] max-w-[430px]">
              <div className="absolute left-4 top-6 h-[170px] w-[86%] max-w-[360px] rotate-[-8deg] rounded-[26px] bg-gray-950 shadow-2xl shadow-gray-300/70" />
              <div className="absolute left-1 top-2 h-[178px] w-[88%] max-w-[368px] rotate-[4deg] rounded-[26px] border border-primary/15 bg-white shadow-2xl shadow-primary/10" />
              <div className="absolute left-0 top-0 flex h-[188px] w-[90%] max-w-[376px] flex-col justify-between rounded-[26px] bg-primary p-5 text-white shadow-2xl shadow-primary/25">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                      {t("label")}
                    </p>
                    <h3 className="mt-4 max-w-[230px] text-2xl font-black leading-tight">
                      {t("customOnlyTitle")}
                    </h3>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary">
                    <Gift size={22} />
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/20 pt-4 text-sm text-white/80">
                  <span>{t("instantCheckout")}</span>
                  <CreditCard size={18} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm font-medium text-gray-700 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm shadow-gray-200/70">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles size={16} />
                </span>
                {t("instantCheckout")}
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm shadow-gray-200/70">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail size={16} />
                </span>
                {t("emailDelivery")}
              </div>
            </div>

            <Button
              type="button"
              className="mt-6 h-11 w-full rounded-full bg-primary px-5 text-white shadow-lg shadow-primary/20 hover:bg-primary/90 sm:w-fit"
              onClick={() => openPurchaseModal()}
            >
              {t("customAmount")}
              <ArrowRight size={16} />
            </Button>
          </div>

          <div className="border-t border-gray-100 p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
            {items.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {items.slice(0, 6).map((giftCard) => (
                  <GiftCardTicket
                    key={giftCard.id}
                    giftCard={giftCard}
                    currency={currency}
                    onSelect={openPurchaseModal}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-dashed border-primary/20 bg-primary/5 p-6 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Gift size={34} />
                </span>
                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  {t("customOnlyTitle")}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  {t("customOnlyDescription")}
                </p>
                <Button
                  type="button"
                  className="mt-5 h-10 rounded-full bg-primary text-white hover:bg-primary/90"
                  onClick={() => openPurchaseModal()}
                >
                  {t("customAmount")}
                  <ArrowRight size={15} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <GiftCardPurchaseModal
        open={isModalOpen}
        restaurantId={restaurantId}
        branchId={branchId}
        currency={currency}
        selectedGiftCard={selectedGiftCard}
        onOpenChange={setIsModalOpen}
      />
    </section>
  );
};
