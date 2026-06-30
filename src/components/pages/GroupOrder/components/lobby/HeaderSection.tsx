import { useTranslations } from "next-intl";
import type { GroupOrder } from "@/types/group-order";

type HeaderSectionProps = {
  order: GroupOrder;
};

export default function HeaderSection({ order }: HeaderSectionProps) {
  const t = useTranslations("groupOrder.lobby.header");
  const total = order?.participantCount || 0;
  const ready = order?.participants?.filter((p) => String(p.status || "").toUpperCase() === "COMPLETED")?.length || 0;

  const percent = total ? (ready / total) * 100 : 0;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

      <div>
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
          {order?.restaurant?.name || t("fallbackTitle")}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {t("description")}
        </p>
      </div>

      <div className="bg-white rounded-2xl px-5 py-4 shadow-md border border-gray-100">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {t("groupStatus")}{" "}
          <span className="text-orange-500 font-semibold ml-1">
            {t("readyCount", { ready, total })}
          </span>
        </p>

        <div className="w-44 h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
          <div
            style={{ width: `${percent}%` }}
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
          />
        </div>
      </div>

    </div>
  );
}
