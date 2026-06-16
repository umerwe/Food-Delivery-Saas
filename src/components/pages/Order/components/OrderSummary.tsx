"use client";

import Image from "next/image";
import { Info, MessageCircle, TicketPercent } from "lucide-react";
import Link from "next/link";
import type { Order, OrderItem } from "@/services/orders";
import { useTranslations } from "next-intl";

export default function OrderSummary({
  title,
  order,
}: {
  title?: string;
  order?: Order | null;
}) {
  const t = useTranslations("orders");
  const orderItems = order?.items || [];
  const resolvedTitle = title ?? t("orderDetails");

  return (
    <div className="sticky top-10 space-y-[42.63px]">
      {/* ITEMS */}
      <section className="space-y-[20.37px]">
        <h2 className="text-[20px] font-medium text-gray-900">
          {resolvedTitle}
        </h2>

        <div className="space-y-[19px]">
          {orderItems.map((item: OrderItem) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative w-[76px] h-[76px] rounded-[12px] overflow-hidden">
                <Image
                  src={item.menuItem?.imageUrl || "/placeholder.png"}
                  alt={item.menuItemName || t("itemFallback")}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 space-y-[8px]">
                <h4 className="text-base font-medium text-gray-900">
                  {item.menuItemName}
                </h4>

                <p className="text-xs text-gray-500">
                  {item.menuItem?.category?.name}
                </p>

                <div className="flex justify-between">
                  <p className="text-base font-medium text-primary">
                    ${item.unitPrice}
                  </p>

                  <div className="text-sm text-gray-700">
                    {t("quantityShort")}: {item.quantity}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BILL */}
      <section className="space-y-[15px]">
        <h2 className="text-[18px] font-semibold text-gray-900">
          {t("billDetails")}
        </h2>

        <div className="space-y-4 text-gray-500 text-sm">
          <div className="flex justify-between">
            <span>{t("itemTotal")}</span>
            <span>${order?.subtotal}</span>
          </div>

          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span>{t("deliveryFee")}</span>
              <Info size={14} />
            </div>
            <span>${order?.deliveryFee}</span>
          </div>

          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span>{t("taxes")}</span>
              <Info size={14} />
            </div>
            <span>${order?.taxAmount}</span>
          </div>
        </div>

        {Number(order?.discountAmount || 0) > 0 && (
          <div className="bg-primary/20 text-primary p-3 rounded-md flex items-center gap-2 text-sm">
            <TicketPercent size={16} />
            {t("discountApplied")}
          </div>
        )}

        <div className="space-y-[10px] pt-[10px]">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{t("discount")}</span>
            <span>${order?.discountAmount}</span>
          </div>

          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>{t("total")}</span>
            <span>${order?.totalAmount}</span>
          </div>
        </div>
      </section>

      {order?.id ? (
        <Link
          href={`/contact/chat?orderId=${order.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(193,0,10,0.22)] transition hover:bg-primary/90"
        >
          <MessageCircle size={18} />
          {t("chatAboutOrder")}
        </Link>
      ) : null}
    </div>
  );
}
