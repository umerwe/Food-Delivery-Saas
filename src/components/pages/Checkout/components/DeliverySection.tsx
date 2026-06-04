'use client';
import { useTranslations } from 'next-intl';

import { DeliveryAddressSection } from '@/components/pages/Checkout/components/DeliveryAddressSection';
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
  scheduledDeliveryValue: string;
  setScheduledDeliveryValue: (value: string) => void;
};

export function DeliverySection(props: DeliverySectionProps) {
  const t = useTranslations("checkout");

  return (
    <div className="space-y-[38px]">
      <DeliveryAddressSection {...props} />
      <section>
        <h2 className="mb-[26px] text-[24px] font-semibold text-gray-900">
          {t("scheduledDelivery")}
        </h2>
        <input
          type="datetime-local"
          value={props.scheduledDeliveryValue}
          onChange={(event) => props.setScheduledDeliveryValue(event.target.value)}
          className="h-12 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <p className="mt-2 text-sm text-gray-500">
          {t("scheduledDeliveryOptional")}
        </p>
      </section>
      <NotesSection note={props.note} setNote={props.setNote} />
      <CustomerDetailsForm {...props} />
      <PaymentMethodSection {...props} />
    </div>
  );
}
