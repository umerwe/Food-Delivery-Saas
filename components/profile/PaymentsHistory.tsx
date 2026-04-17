"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type TransactionItem = {
  id: number;
  title: string;
  subtitle: string;
  date: string;
  points: string;
  type: "earned" | "redeemed" | "bonus";
  image?: string;
  iconBg?: string;
  iconText?: string;
};

const groupedTransactions: {
  month: string;
  items: TransactionItem[];
}[] = [
  {
    month: "October 2023",
    items: [
      {
        id: 1,
        title: "The Alchemist's Table",
        subtitle: "Dining Experience",
        date: "Oct 24, 2023",
        points: "+850",
        type: "earned",
        image: "/images/points/alchemist-table.png",
      },
      {
        id: 2,
        title: "Wine Tasting Event Ticket",
        subtitle: "Redemption",
        date: "Oct 18, 2023",
        points: "-2,500",
        type: "redeemed",
        iconBg: "bg-[#FDECEC]",
        iconText: "🎟️",
      },
      {
        id: 3,
        title: "Lumière Brasserie",
        subtitle: "Dinner for Two",
        date: "Oct 12, 2023",
        points: "+1,200",
        type: "earned",
        image: "/images/points/lumiere-brasserie.png",
      },
    ],
  },
  {
    month: "September 2023",
    items: [
      {
        id: 4,
        title: "Sugar & Spice Atelier",
        subtitle: "Bakery Purchase",
        date: "Sep 28, 2023",
        points: "+145",
        type: "earned",
        image: "/images/points/sugar-spice.png",
      },
      {
        id: 5,
        title: "Monthly Membership Bonus",
        subtitle: "Loyalty Reward",
        date: "Sep 01, 2023",
        points: "+500",
        type: "bonus",
        iconBg: "bg-[#D9ECF4]",
        iconText: "✦",
      },
    ],
  },
];

const getPointsColor = (type: TransactionItem["type"]) => {
  if (type === "redeemed") return "text-[#D91F26]";
  return "text-[#18A957]";
};

const getPointsLabel = (type: TransactionItem["type"]) => {
  if (type === "redeemed") return "REDEEMED";
  if (type === "bonus") return "BONUS";
  return "EARNED";
};

function TransactionAvatar({ item }: { item: TransactionItem }) {
  if (item.image) {
    return (
      <div className="relative h-[42px] w-[42px] overflow-hidden rounded-[12px] bg-[#F4F4F4] shrink-0">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover"
          sizes="42px"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] ${item.iconBg || "bg-[#F4F4F4]"}`}
    >
      <span className="text-[15px]">{item.iconText || "•"}</span>
    </div>
  );
}

export default function PaymentsHistory() {
  return (
    <section className="mx-auto w-full px-4 md:px-40  pb-[100px] pt-[20px]">
      <div className="rounded-[28px] bg-[#FAFAFA] p-5 md:p-8">
        <div className="mb-7">
          <h1 className="text-[34px] font-semibold leading-tight text-[#171717]">
            Points History
          </h1>
          <p className="mt-1 text-[14px] text-[#7C7C7C]">
            Review your culinary journey and earned rewards.
          </p>
        </div>

        <div className="mb-8 rounded-[14px] bg-[#DC2B2F] px-4 py-5 text-white shadow-[0_10px_30px_rgba(220,43,47,0.20)] md:px-5 md:py-6">
          <p className="text-[11px] uppercase tracking-[0.08em] text-white/80">
            Current Balance
          </p>

          <div className="mt-2 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-[44px] font-semibold leading-none">$1,245.50</h2>

              <div className="mt-12">
                <p className="text-[12px] text-white/85">Loyalty Points</p>
                <p className="text-[24px] font-semibold leading-none">2,450 pts</p>
              </div>
            </div>

            <div className="md:self-end">
              <Button className="h-[38px] rounded-full bg-white px-5 text-[13px] font-medium text-[#DC2B2F] hover:bg-white/90">
                Add Funds
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {groupedTransactions.map((group) => (
            <div key={group.month}>
              <div className="mb-5 flex items-center gap-4">
                <h3 className="shrink-0 text-[28px] font-semibold leading-none text-[#1A1A1A]">
                  {group.month}
                </h3>
                <div className="h-px w-full bg-[#E6E6E6]" />
              </div>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-[14px] bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <TransactionAvatar item={item} />

                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-[#171717]">
                          {item.title}
                        </p>
                        <p className="truncate text-[12px] text-[#8C8C8C]">
                          {item.subtitle} • {item.date}
                        </p>
                      </div>
                    </div>

                    <div className="ml-4 text-right">
                      <p
                        className={`text-[26px] font-semibold leading-none ${getPointsColor(item.type)}`}
                      >
                        {item.points}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-[#B1B1B1]">
                        {getPointsLabel(item.type)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-[13px] text-[#8B8B8B]">
            Showing 1–5 of 142 transactions
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#4B4B4B] transition hover:bg-[#F7F7F7]"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#BE1E2D] text-sm font-semibold text-white"
            >
              1
            </button>

            <button
              type="button"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-sm font-medium text-[#242424] transition hover:bg-[#F4F4F4]"
            >
              2
            </button>

            <button
              type="button"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-sm font-medium text-[#242424] transition hover:bg-[#F4F4F4]"
            >
              3
            </button>

            <button
              type="button"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#4B4B4B] transition hover:bg-[#F7F7F7]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}