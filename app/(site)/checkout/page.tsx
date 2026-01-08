import Tabs from '@/components/checkout/Tabs';
import DeliverySection from '@/components/checkout/DeliverySection';
import PickupSection from '@/components/checkout/PickupSection';
import CartSummarySection from '@/components/checkout/CartSummarySection';

export default async function CheckoutPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string }>;
}) {
    const { type } = await searchParams;
    const activeTab = type === 'pickup' ? 'pickup' : 'delivery';

    return (
        <div className="max-w-[1400px] mx-auto mt-[63px] mb-[113px] px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                <div className="lg:col-span-7 space-y-[38px]">
                    <Tabs activeTab={activeTab} />

                    {activeTab === 'delivery' ? (
                        <DeliverySection />
                    ) : (
                        <PickupSection />
                    )}
                </div>

                <div className="lg:col-span-5">
                    <CartSummarySection />
                </div>

            </div>
        </div>
    );
}
