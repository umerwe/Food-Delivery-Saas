import AddressSection from "@/components/checkout/AddressSection"
import TimeSection from "@/components/checkout/TimeSection"
import NotesSection from "@/components/checkout/NotesSection"
import PaymentMethodSection from "@/components/checkout/PaymentMethodSection"

export default function PickupSection() {
  return (
    <div className="space-y-[38px]">
      <AddressSection />
      <NotesSection />
      <TimeSection />
      <PaymentMethodSection />
    </div>
  )
}
