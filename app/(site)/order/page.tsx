import { ArrowLeft } from "lucide-react"
import CartSummarySection from "@/components/checkout/CartSummarySection"
import Link from "next/link"

export default function OrderStatusPage() {
    const orderSteps = [
        { id: 1, title: "Order Placed", desc: "Your order has been placed successfully.", active: true },
        { id: 2, title: "Order Confirmed", desc: "Your order is confirmed and being prepared.", active: true },
        { id: 3, title: "Preparing your food", desc: "We're getting your order ready.", active: true },
        { id: 4, title: "Picked Up", desc: "Your order is out for delivery.", active: false },
        { id: 5, title: "Delivered", desc: "Your order has been delivered. Enjoy!", active: false },
    ]

    return (
        <div className="max-w-[1400px] mx-auto mt-[36px] mb-[113px] px-6">
            <Link
                href="/checkout"
                className="flex items-center gap-2 mb-[45px] hover:opacity-70 transition-opacity">
                <ArrowLeft size={37} />
                <span className="text-xl font-semibold">Back</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* LEFT COLUMN: TRACKING */}
                <div className="lg:col-span-7">
                    <div className="mb-[35px]">
                        <h1 className="text-xl font-semibold text-gray-900 mb-[10px]">Track Your Order</h1>
                        <p className="text-sm text-gray-400">
                            Order #MG-2025-001847 • Estimated delivery: Tomorrow, 2:00 PM - 6:00 PM
                        </p>
                    </div>

                    {/* Status Box */}
                    <div className="bg-white rounded-[10px] shadow-lg px-[61px] py-[35px] border border-gray-50">
                        <h2 className="text-xl font-semibold mb-[36px]">Order Status</h2>

                        <div className="space-y-0">
                            {orderSteps.map((step, index) => (
                                <div key={step.id} className="relative flex gap-6 pb-10 group">
                                    {index !== orderSteps.length - 1 && (
                                        <div className={`absolute left-[17px] top-10 w-px h-full border-l-2 border-dashed border-gray-200`} />
                                    )}
                                    <div className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-sm font-medium transition-colors ${step.active ? 'bg-primary text-white' : 'bg-[#D9D9D9] text-white'}`}>
                                        {step.id}
                                    </div>

                                    <div className="pt-1">
                                        <h3 className={`text-[22px] font-medium mb-[4px] ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5">
                    <CartSummarySection
                        title="Order Details"
                    />
                </div>
            </div>
        </div>
    )
}