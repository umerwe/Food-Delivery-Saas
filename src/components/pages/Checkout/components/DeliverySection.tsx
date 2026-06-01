'use client';
import DeliveryAddressSection from '@/components/pages/Checkout/components/DeliveryAddressSection';
import NotesSection from '@/components/pages/Checkout/components/NotesSection';
import CustomerDetailsForm from '@/components/pages/Checkout/components/CustomerDetailsForm';
import PaymentMethodSection from '@/components/pages/Checkout/components/PaymentMethodSection';

type DeliverySectionProps = {
  selectedAddress: string | null;
  setSelectedAddress: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  customer: { name: string; phone: string; email: string };
  setCustomer: (value: { name: string; phone: string; email: string }) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
};

export default function DeliverySection(props: DeliverySectionProps) {
  return (
    <div className="space-y-[38px]">
      <DeliveryAddressSection {...props} />
      <NotesSection note={props.note} setNote={props.setNote} />
      <CustomerDetailsForm {...props} />
      <PaymentMethodSection {...props} />
    </div>
  );
}
