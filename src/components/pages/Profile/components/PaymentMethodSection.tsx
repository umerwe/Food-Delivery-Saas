import { cn } from "@/lib/utils";
import Image from "next/image";
import PaymentForm from "@/components/forms/PaymentForm";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function PaymentMethodSection() {
  const t = useTranslations("profile.payment");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px] items-start">
      <div className="border border-gray-300 rounded-xl px-[24px] py-[40px] space-y-[32px] shadow-sm">
        <SavedCardItem icon="/mastercard.png" name="Master Card" number="**** **** **** *234" checked />
        <SavedCardItem icon="/visa.png" name="HDFC Bank" number="**** **** **** *234" />
        <SavedCardItem icon="/visa.png" name="HDFC Bank" number="**** **** **** *234" />

        <div className="flex gap-[31px] mt-[48px]">
          <Button
            variant="outline"
            className="flex-1 rounded-lg text-lg h-[50px] text-primary border-primary bg-white"
          >
            {t("addNewMethod")}
          </Button>
          <Button
            variant="primary"
            className="flex-1 rounded-lg text-lg h-[50px]"
          >
            {t("selectPayment")}
          </Button>
        </div>
      </div>

      <PaymentForm />
    </div>
  );
}

type SavedCardItemProps = {
  icon: string;
  name: string;
  number: string;
  checked?: boolean;
};

function SavedCardItem({ icon, name, number, checked = false }: SavedCardItemProps) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-[12px] border-2 transition-all",
      checked ? "border-primary bg-white" : "border-gray-100"
    )}>
      <div className="flex items-center gap-4">
        <input type="checkbox" checked={checked} readOnly className="accent-primary w-4 h-4" />
        <Image src={icon} alt={name} width={40} height={25} />
        <span className="text-[14px] font-medium text-gray-600">{name}</span>
      </div>
      <span className="text-[14px] font-medium text-gray-600">{number}</span>
    </div>
  );
}
