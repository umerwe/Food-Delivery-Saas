"use client";

import { ArrowRight, CreditCard, Gift } from "lucide-react";
import { useMemo, useState, type CSSProperties, type SVGProps } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { formatMoney } from "@/lib/money";
import type { GiftCardAvailableItem, HomeGiftCards } from "@/types/gift-cards";
import { GiftCardPurchaseModal } from "@/components/pages/Home/components/GiftCardPurchaseModal";

type GiftCardsSectionProps = {
  giftCards?: HomeGiftCards | null;
  restaurantId?: string | null;
  branchId?: string | null;
  currency?: string | null;
};

type GiftCardTicketProps = {
  giftCard: GiftCardAvailableItem;
  currency?: string | null;
  index: number;
  onSelect: (giftCard: GiftCardAvailableItem) => void;
};

type GiftCardVariant = "cream" | "red" | "deepRed" | "burgundy";
type GiftCardIconName = "cloche" | "cutlery" | "gift";
type GiftCardDecorName = "leaf" | "rosemary" | "wine" | "floral";

type GiftCardVisual = {
  variant: GiftCardVariant;
  icon: GiftCardIconName;
  decor: GiftCardDecorName;
};

type GiftCardVariantStyle = {
  card: string;
  amount: string;
  title: string;
  icon: string;
  divider: string;
  button: string;
  decoration: string;
};

const getMessage = (t: unknown, key: string, fallback: string) => {
  try {
    const value = (t as (translationKey: string) => string)(key);
    return value && value !== key ? value : fallback;
  } catch {
    return fallback;
  }
};

const formatAmount = (amount: number, currency?: string | null) =>
  formatMoney(amount, currency, { maximumFractionDigits: 0 });

const ticketVisuals: GiftCardVisual[] = [
  {
    variant: "cream",
    icon: "cloche",
    decor: "leaf",
  },
  {
    variant: "red",
    icon: "cutlery",
    decor: "rosemary",
  },
  {
    variant: "deepRed",
    icon: "cloche",
    decor: "wine",
  },
  {
    variant: "burgundy",
    icon: "gift",
    decor: "floral",
  },
];

const variantStyles: Record<GiftCardVariant, GiftCardVariantStyle> = {
  cream: {
    card: "border border-[#c58a3d]/25 bg-[linear-gradient(145deg,#fffaf2_0%,#f8efe2_46%,#fffdf8_100%)] text-[#241815] shadow-[0_10px_24px_rgba(91,56,20,0.07),0_2px_7px_rgba(91,56,20,0.04)] hover:shadow-[0_14px_30px_rgba(91,56,20,0.1),0_4px_10px_rgba(91,56,20,0.05)]",
    amount: "text-[#bd8337]",
    title: "text-[#241815]",
    icon: "text-[#c58a3d]",
    divider: "bg-[#c58a3d]/70",
    button:
      "border border-[#bd8337]/65 bg-[#fffaf5] text-[#bd8337] shadow-[0_6px_14px_rgba(91,56,20,0.06)] group-hover:bg-white",
    decoration: "text-[#c58a3d]",
  },
  red: {
    card: "bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(145deg,#ff4248_0%,#ed1f2b_45%,#c90012_100%)] text-white shadow-[0_10px_24px_rgba(198,0,18,0.1),0_2px_7px_rgba(105,0,10,0.06)] hover:shadow-[0_14px_32px_rgba(198,0,18,0.14),0_4px_10px_rgba(105,0,10,0.08)]",
    amount: "text-[#ffe0a3]",
    title: "text-white",
    icon: "text-[#f5c16d]",
    divider: "bg-[#f5c16d]/80",
    button:
      "bg-white text-[#e21c2b] shadow-[0_7px_16px_rgba(80,0,5,0.08)] group-hover:bg-white/95",
    decoration: "text-[#f5c16d]",
  },
  deepRed: {
    card: "bg-[radial-gradient(circle_at_25%_8%,rgba(255,255,255,0.15),transparent_30%),linear-gradient(145deg,#c90012_0%,#a5000d_48%,#720007_100%)] text-white shadow-[0_10px_25px_rgba(118,0,7,0.11),0_2px_8px_rgba(75,0,5,0.07)] hover:shadow-[0_14px_34px_rgba(118,0,7,0.15),0_4px_11px_rgba(75,0,5,0.09)]",
    amount: "text-[#ffe1a3]",
    title: "text-white",
    icon: "text-[#eeb85f]",
    divider: "bg-[#eeb85f]/80",
    button:
      "bg-white text-[#b00012] shadow-[0_7px_16px_rgba(45,0,5,0.09)] group-hover:bg-white/95",
    decoration: "text-[#eeb85f]",
  },
  burgundy: {
    card: "bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.12),transparent_28%),linear-gradient(145deg,#a60010_0%,#88000b_45%,#5d0006_100%)] text-white shadow-[0_10px_25px_rgba(93,0,6,0.12),0_2px_8px_rgba(45,0,4,0.07)] hover:shadow-[0_14px_34px_rgba(93,0,6,0.16),0_4px_11px_rgba(45,0,4,0.09)]",
    amount: "text-[#ffe0a3]",
    title: "text-white",
    icon: "text-[#e5ad56]",
    divider: "bg-[#e5ad56]/80",
    button:
      "bg-white text-[#a60010] shadow-[0_7px_16px_rgba(45,0,4,0.09)] group-hover:bg-white/95",
    decoration: "text-[#e5ad56]",
  },
};

const textureStyles: Record<GiftCardVariant, CSSProperties> = {
  cream: {
    background:
      "radial-gradient(circle at 20% 20%, rgba(189, 131, 55, 0.14) 0 1px, transparent 1px), repeating-linear-gradient(45deg, rgba(189, 131, 55, 0.08) 0 1px, transparent 1px 5px)",
    backgroundSize: "18px 18px, 7px 7px",
  },
  red: {
    background:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.32) 0 1px, transparent 1px), repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 5px)",
    backgroundSize: "18px 18px, 7px 7px",
  },
  deepRed: {
    background:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.24) 0 1px, transparent 1px), repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 5px)",
    backgroundSize: "18px 18px, 7px 7px",
  },
  burgundy: {
    background:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22) 0 1px, transparent 1px), repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 5px)",
    backgroundSize: "18px 18px, 7px 7px",
  },
};

const decorationClasses: Record<GiftCardDecorName, string> = {
  leaf:
    "right-[-18px] top-3 h-auto w-[118px] rotate-[8deg] opacity-45 sm:w-[128px]",
  rosemary:
    "bottom-2 right-[-12px] h-auto w-[112px] opacity-35 sm:w-[128px]",
  wine: "right-5 top-8 h-auto w-[62px] opacity-35 sm:w-[72px]",
  floral:
    "right-[-36px] top-6 h-auto w-[136px] opacity-25 sm:w-[154px]",
};

const ClocheLineIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M8.5 31.5h31" />
    <path d="M12.5 31.5c.9-8.4 5.7-14.1 11.5-14.1s10.6 5.7 11.5 14.1" />
    <path d="M24 17.4v-4.2" />
    <path d="M20.4 13.2h7.2" />
    <path d="M11.2 36h25.6" />
  </svg>
);

const CutleryLineIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M15 9v13.8" />
    <path d="M10.8 9v8.6c0 3.1 1.9 5.2 4.2 5.2s4.2-2.1 4.2-5.2V9" />
    <path d="M15 22.8V39" />
    <path d="M30.5 9c4.1 2.8 6.2 8.6 3.2 14.8-.8 1.6-1.4 3.1-1.4 4.9V39" />
    <path d="M30.5 9V39" />
  </svg>
);

const GiftLineIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M10 20h28v18H10z" />
    <path d="M8 14h32v6H8z" />
    <path d="M24 14v24" />
    <path d="M18.8 14c-3.6-1.4-5.5-3.3-4.8-5.1.8-2 4.1-1.9 6 .4 1.4 1.7 2.4 4.7 2.4 4.7" />
    <path d="M29.2 14c3.6-1.4 5.5-3.3 4.8-5.1-.8-2-4.1-1.9-6 .4-1.4 1.7-2.4 4.7-2.4 4.7" />
  </svg>
);

const LeafLineArt = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 130 170"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M38 151C70 103 81 63 80 12" />
    <path d="M63 106c-15-1-27 4-36 15 16 2 29-3 36-15Z" />
    <path d="M72 82c-16-4-29 0-40 10 16 5 30 1 40-10Z" />
    <path d="M78 57c-13-6-25-6-36 1 13 7 26 7 36-1Z" />
    <path d="M80 34c-11-5-21-5-30 2 11 6 22 5 30-2Z" />
    <path d="M69 119c13-9 26-11 40-6-12 11-26 13-40 6Z" />
    <path d="M78 94c15-8 30-9 44-2-14 9-29 10-44 2Z" />
    <path d="M82 69c13-7 26-7 39-1-13 8-26 8-39 1Z" />
    <path d="M83 45c12-7 23-8 34-4-10 8-22 10-34 4Z" />
  </svg>
);

const RosemaryLineArt = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 130 170"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M78 162C65 121 61 80 68 20" />
    <path d="M65 132c-14-7-27-8-39-1 13 9 27 9 39 1Z" />
    <path d="M65 113c-13-9-26-12-39-7 12 10 26 12 39 7Z" />
    <path d="M66 93c-12-10-24-14-37-11 11 11 24 15 37 11Z" />
    <path d="M68 73c-11-9-22-13-34-11 10 11 22 15 34 11Z" />
    <path d="M71 53c-9-9-19-13-30-12 8 10 19 14 30 12Z" />
    <path d="M74 134c14-6 27-6 39 1-13 8-26 8-39-1Z" />
    <path d="M72 114c14-8 28-9 41-3-13 9-27 10-41 3Z" />
    <path d="M72 93c12-9 25-12 38-8-11 10-24 13-38 8Z" />
    <path d="M72 72c11-9 23-12 35-9-10 10-22 13-35 9Z" />
    <path d="M71 51c10-8 20-11 31-9-9 9-20 12-31 9Z" />
  </svg>
);

const WineGlassLineArt = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 90 150"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M27 11h36l-4.7 55.5C57 82.2 51.8 91 45 91s-12-8.8-13.3-24.5L27 11Z" />
    <path d="M31.5 55.5h27" />
    <path d="M45 91v39" />
    <path d="M29 134h32" />
    <path d="M35 140h20" />
  </svg>
);

const FloralLineArt = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 170 190"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.15"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M55 184C86 139 103 91 107 23" />
    <path d="M104 52c-14-18-13-35 2-47 13 15 13 33-2 47Z" />
    <path d="M112 65c21-5 37 1 48 17-19 7-36 1-48-17Z" />
    <path d="M97 84c-24-2-41 8-51 28 22 4 39-6 51-28Z" />
    <path d="M103 105c22-8 41-4 56 12-20 10-39 6-56-12Z" />
    <path d="M83 130c-22 0-38 10-48 28 21 3 37-7 48-28Z" />
    <path d="M95 143c21-9 39-6 53 8-19 11-37 8-53-8Z" />
    <path d="M122 32c18-4 32 1 42 14-17 7-31 2-42-14Z" />
    <path d="M81 54c-17-5-28-15-34-30 16 1 28 12 34 30Z" />
  </svg>
);

const GiftCardTopIcon = ({
  icon,
  className,
}: {
  icon: GiftCardIconName;
  className?: string;
}) => {
  if (icon === "cutlery") {
    return <CutleryLineIcon className={className} />;
  }

  if (icon === "gift") {
    return <GiftLineIcon className={className} />;
  }

  return <ClocheLineIcon className={className} />;
};

const GiftCardDecoration = ({
  decor,
  className,
}: {
  decor: GiftCardDecorName;
  className?: string;
}) => {
  if (decor === "rosemary") {
    return <RosemaryLineArt className={className} />;
  }

  if (decor === "wine") {
    return <WineGlassLineArt className={className} />;
  }

  if (decor === "floral") {
    return <FloralLineArt className={className} />;
  }

  return <LeafLineArt className={className} />;
};

const PremiumGiftCardShell = ({
  variant,
  icon,
  decor,
  amount,
  title,
  ariaLabel,
  onClick,
}: {
  variant: GiftCardVariant;
  icon: GiftCardIconName;
  decor: GiftCardDecorName;
  amount: string;
  title: string;
  ariaLabel: string;
  onClick: () => void;
}) => {
  const t = useTranslations("home.giftCards");
  const purchaseText = getMessage(t, "purchase", "Purchase");
  const styles = variantStyles[variant];

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`group relative isolate flex h-[218px] w-full cursor-grab flex-col overflow-hidden rounded-[24px] p-5 text-left transition duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:cursor-grabbing sm:h-[236px] lg:h-[244px] ${styles.card}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.14] mix-blend-soft-light"
        style={textureStyles[variant]}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 -top-10 z-[1] h-32 w-32 rounded-full bg-white/15 blur-2xl"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-14 left-4 z-[1] h-28 w-28 rounded-full bg-black/10 blur-2xl"
      />

      <GiftCardDecoration
        decor={decor}
        className={`pointer-events-none absolute z-[1] ${decorationClasses[decor]} ${styles.decoration}`}
      />

      <span className="relative z-10 flex h-full flex-col">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-current/70 ${styles.icon}`}
        >
          <GiftCardTopIcon icon={icon} className="h-6 w-6" />
        </span>

        <span className="mt-4 min-w-0 flex-1 pr-12 sm:mt-5">
          <span
            className={`block font-serif text-[34px] font-medium leading-none tracking-tight sm:text-[40px] ${styles.amount}`}
          >
            {amount}
          </span>

          <span
            className={`mt-2 line-clamp-2 block text-[15px] font-semibold leading-tight sm:text-[17px] ${styles.title}`}
          >
            {title}
          </span>

          <span
            aria-hidden="true"
            className={`mt-4 block h-px w-9 ${styles.divider}`}
          />
        </span>

        <span
          className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] transition duration-200 group-hover:-translate-y-0.5 sm:h-11 sm:text-[12px] ${styles.button}`}
        >
          {purchaseText}
          <ArrowRight size={15} strokeWidth={2.4} />
        </span>
      </span>
    </button>
  );
};

const GiftCardTicket = ({
  giftCard,
  currency,
  index,
  onSelect,
}: GiftCardTicketProps) => {
  const t = useTranslations("home.giftCards");
  const visual = ticketVisuals[index % ticketVisuals.length];
  const purchaseText = getMessage(t, "purchase", "Purchase");

  return (
    <PremiumGiftCardShell
      variant={visual.variant}
      icon={visual.icon}
      decor={visual.decor}
      amount={formatAmount(giftCard.amount, currency)}
      title={giftCard.title}
      ariaLabel={`${purchaseText} ${giftCard.title}`}
      onClick={() => onSelect(giftCard)}
    />
  );
};

function GiftCardIntroTile({ onBuy }: { onBuy: () => void }) {
  const t = useTranslations("home.giftCards");

  return (
    <article className="flex h-[218px] w-full flex-col justify-center bg-transparent p-0 sm:h-[236px] lg:h-[244px]">
      <div className="flex max-w-[255px] flex-col">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          {t("label")}
        </p>

        <h2 className="mt-2 text-2xl font-black leading-[1.05] tracking-tight text-gray-950 sm:text-[28px]">
          {t("buy")}
        </h2>

        <p className="mt-2 line-clamp-3 text-sm font-medium leading-5 text-gray-600">
          {t("description")}
        </p>

        <Button
          type="button"
          className="mt-4 h-10 w-fit rounded-full bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
          onClick={onBuy}
        >
          {t("buy")}
          <ArrowRight size={15} />
        </Button>
      </div>
    </article>
  );
}

export const GiftCardsSection = ({
  giftCards,
  restaurantId,
  branchId,
  currency,
}: GiftCardsSectionProps) => {
  const t = useTranslations("home.giftCards");
  const [selectedGiftCard, setSelectedGiftCard] =
    useState<GiftCardAvailableItem | null>(null);
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
      className="mx-auto max-w-[1400px] px-4 pb-[30px] pt-[1px] sm:px-6 sm:pb-[60px] sm:pt-[1px]"
    >
      <div className="rounded-[30px] bg-white px-4 py-5 sm:px-6 sm:py-6">
        {items.length > 0 ? (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
            <div className="lg:w-[280px] lg:shrink-0">
              <GiftCardIntroTile onBuy={() => openPurchaseModal()} />
            </div>

            <Carousel
              opts={{
                align: "start",
                dragFree: true,
              }}
              className="min-w-0 flex-1"
            >
              <CarouselContent className="-ml-4 cursor-grab py-3 active:cursor-grabbing">
                {items.map((giftCard, index) => (
                  <CarouselItem
                    key={giftCard.id}
                    className="basis-[78%] pl-4 sm:basis-[48%] md:basis-[36%] lg:basis-1/4"
                  >
                    <GiftCardTicket
                      giftCard={giftCard}
                      currency={currency}
                      index={index}
                      onSelect={openPurchaseModal}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        ) : (
          <div className="flex min-h-[258px] flex-col items-center justify-center rounded-[28px] bg-gradient-to-br from-[#EB4D3D] via-[#D93528] to-[#A91216] p-6 text-center text-white">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary">
              <Gift size={34} />
            </span>

            <h3 className="mt-4 text-xl font-bold">
              {t("customOnlyTitle")}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
              {t("customOnlyDescription")}
            </p>

            <Button
              type="button"
              className="mt-5 h-10 rounded-full bg-white px-5 text-primary hover:bg-white/90"
              onClick={() => openPurchaseModal()}
            >
              {t("buy")}
              <CreditCard size={15} />
            </Button>
          </div>
        )}
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
