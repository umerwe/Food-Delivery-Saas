import { CustomerDetailsForm } from "@/components/pages/Checkout/components/CustomerDetailsForm"
import { SelectPickupTimeSection } from "@/components/pages/Checkout/components/TimeSection"
import NotesSection from "@/components/pages/Checkout/components/NotesSection"
import { PaymentMethodSection } from "@/components/pages/Checkout/components/PaymentMethodSection"
import type { BranchRecord } from "@/types/branch-selector";
import { useTranslations } from "next-intl";

type PickupSectionProps = {
  selectedAddress: string | null;
  setSelectedAddress: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  customer: { name: string; phone: string; email: string };
  setCustomer: (value: { name: string; phone: string; email: string }) => void;
  isGuest?: boolean;
  privacyPolicyAccepted?: boolean;
  setPrivacyPolicyAccepted?: (value: boolean) => void;
  privacyPolicy?: {
    title: string;
    content: string;
    policyLink: string;
  } | null;
  privacyPolicyLoading?: boolean;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  pickupDate: Date | null;
  setPickupDate: (value: Date | null) => void;
  pickupTime: string | null;
  setPickupTime: (value: string | null) => void;
  pickupScheduleMode: "now" | "schedule";
  setPickupScheduleMode: (value: "now" | "schedule") => void;
  selectedBranch?: BranchRecord | null;
};

export function PickupSection(props: PickupSectionProps) {
  const t = useTranslations("checkout");

  return (
    <div className="space-y-[38px]">
      <SelectPickupTimeSection {...props} />
      <NotesSection {...props} />
      <CustomerDetailsForm {...props} editable={props.isGuest} />
      <PaymentMethodSection {...props} cashLabel={t("cash")} />
    </div>
  );
}
