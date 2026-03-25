"use client";

import Image from "next/image";
import { Info, TicketPercent } from "lucide-react";

export default function OrderSummary({
  title = "Order Details",
  order,
}: {
  title?: string;
  order?: any;
}) {
  const orderItems = order?.items || [];

  return (
    <div className="sticky top-10 space-y-[42.63px]">
      {/* ITEMS */}
      <section className="space-y-[20.37px]">
        <h2 className="text-[20px] font-medium text-gray-900">
          {title}
        </h2>

        <div className="space-y-[19px]">
          {orderItems.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative w-[76px] h-[76px] rounded-[12px] overflow-hidden">
                <Image
                  src={item.menuItem?.imageUrl || "/placeholder.png"}
                  alt={item.menuItemName}
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
                    Rs {item.unitPrice}
                  </p>

                  <div className="text-sm text-gray-700">
                    Qty: {item.quantity}
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
          Bill details
        </h2>

        <div className="space-y-4 text-gray-500 text-sm">
          <div className="flex justify-between">
            <span>Item Total</span>
            <span>Rs {order?.subtotal}</span>
          </div>

          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span>Delivery Fee</span>
              <Info size={14} />
            </div>
            <span>Rs {order?.deliveryFee}</span>
          </div>

          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span>Taxes</span>
              <Info size={14} />
            </div>
            <span>Rs {order?.taxAmount}</span>
          </div>
        </div>

        {order?.discountAmount > 0 && (
          <div className="bg-primary/20 text-primary p-3 rounded-md flex items-center gap-2 text-sm">
            <TicketPercent size={16} />
            Discount Applied
          </div>
        )}

        <div className="space-y-[10px] pt-[10px]">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Discount</span>
            <span>Rs {order?.discountAmount}</span>
          </div>

          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Total</span>
            <span>Rs {order?.totalAmount}</span>
          </div>
        </div>
      </section>
    </div>
  );
}