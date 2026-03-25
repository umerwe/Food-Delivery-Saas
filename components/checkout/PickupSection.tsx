import AddressSection from "@/components/checkout/AddressSection"
import TimeSection from "@/components/checkout/TimeSection"
import NotesSection from "@/components/checkout/NotesSection"
import PaymentMethodSection from "@/components/checkout/PaymentMethodSection"

export default function PickupSection(props: any) {
  return (
    <div className="space-y-[38px]">
      <AddressSection {...props} />
      <NotesSection {...props} />
      <TimeSection {...props} />
      <PaymentMethodSection {...props} />
    </div>
  );
}