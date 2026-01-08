import DeliveryAddressSection from '@/components/checkout/DeliveryAddressSection';
import NotesSection from '@/components/checkout/NotesSection';
import CustomerDetailsForm from '@/components/checkout/CustomerDetailsForm';
import PaymentMethodSection from '@/components/checkout/PaymentMethodSection';

export default function DeliverySection() {
    return (
        <div className="space-y-[38px]">
            <DeliveryAddressSection />
            <NotesSection />
            <CustomerDetailsForm />
            <PaymentMethodSection />
        </div>
    );
}
