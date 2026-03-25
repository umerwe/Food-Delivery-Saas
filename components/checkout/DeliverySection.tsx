'use client';
import DeliveryAddressSection from '@/components/checkout/DeliveryAddressSection';
import NotesSection from '@/components/checkout/NotesSection';
import CustomerDetailsForm from '@/components/checkout/CustomerDetailsForm';
import PaymentMethodSection from '@/components/checkout/PaymentMethodSection';

export default function DeliverySection(props: any) {
  return (
    <div className="space-y-[38px]">
      <DeliveryAddressSection {...props} />
      <NotesSection note={props.note} setNote={props.setNote} />
      <CustomerDetailsForm {...props} />
      <PaymentMethodSection {...props} />
    </div>
  );
}