"use client";

import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import useGroupOrder, { useGroupOrderApi } from "@/hooks/useGroupOrder";
import type { GroupOrderItem, GroupOrderParticipant } from "@/types/group-order";

type UserCardProps = {
  participant: GroupOrderParticipant;
  orderId: string | number;
  isHost?: boolean;
};

export default function UserCard({ participant, orderId, isHost }: UserCardProps) {
  const t = useTranslations("groupOrder.lobby.userCard");
  const { deleteGroupOrderItem, updateGroupOrderItemQuantity } = useGroupOrderApi(null);

  const user = participant?.user;
  const items = participant?.items || [];

  const handleDelete = async (itemId: string | number) => {
    await deleteGroupOrderItem({ orderId, itemId });
    location.reload();
  };

  const updateQty = async (item: GroupOrderItem, qty: number) => {
    if (qty < 1) return;

    await updateGroupOrderItemQuantity({ orderId, itemId: item.id, quantity: qty });

    location.reload();
  };
const { canEditItems, participant: currentUserParticipant } = useGroupOrder();
  const picking = items.length === 0;
const isCurrentUser = participant?.userId === currentUserParticipant?.userId;
const canEdit = canEditItems && isCurrentUser;
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-md border border-gray-100 transition hover:shadow-lg hover:-translate-y-[2px] ${picking ? "border-dashed border-gray-300 bg-gray-50" : ""}`}>

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-full overflow-hidden relative border border-gray-200">
            <Image
              src={user?.avatarUrl || "https://i.pravatar.cc/150"}
              alt={user?.firstName || ""}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <p className="font-semibold text-gray-900">
              {user?.firstName} {user?.lastName} {isHost && t("hostSuffix")}
            </p>

            {picking && (
              <p className="text-sm text-orange-500 mt-1">
                {t("pickingItems")}
              </p>
            )}
          </div>
        </div>

        {!picking && (
          <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-medium">
            {t("ready")}
          </span>
        )}
      </div>

      {!picking && (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-md overflow-hidden relative border border-gray-200">
                  <Image
                    src={item.menuItem?.imageUrl || "/items/table.png"}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  {item.menuItem?.name}
                </p>
              </div>

              <div className="flex items-center gap-3">

                {/* QTY */}
                <div className="flex items-center gap-2 border rounded-full px-2 py-1">
                  <button onClick={() => updateQty(item, item.quantity - 1)}  disabled={!canEdit}>
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="text-sm">{item.quantity}</span>

                  <button onClick={() => updateQty(item, item.quantity + 1)}  disabled={!canEdit}>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* DELETE */}
                 <button
  disabled={!canEdit}
  onClick={() => handleDelete(item.id)}
  className={`text-red-500 ${!canEdit && "opacity-40 cursor-not-allowed"}`}
>

                  <Trash2 className="w-4 h-4" />
                </button>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
