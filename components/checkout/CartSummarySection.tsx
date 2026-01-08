import Image from 'next/image';
import {
    Plus,
    Minus,
    Info,
    TicketPercent
} from 'lucide-react';
import { Button } from "@/components/ui/button";

const cartItems = [
    { id: 1, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
    { id: 2, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
    { id: 3, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
    { id: 4, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
];

export default function CartSummarySection() {
    return (
        <div className="sticky top-10 space-y-[42.63px]">
            <section className="space-y-[20.37px]">
                <h2 className="text-[20px] font-medium text-gray-900">Cart Summary</h2>
                {/* Cart Items List */}
                <div className="space-y-[19px]">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                            <div className="relative w-[76px] h-[76px] rounded-[12px] overflow-hidden shrink-0">
                                <Image
                                    src={item.img}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-1 space-y-[8px]">
                                <h4 className="text-base font-medium text-gray-900 leading-tight">{item.name}</h4>
                                <p className="text-xs text-gray-900">{item.desc}</p>
                                <div className='flex justify-between py-[4px]'>
                                    <p className="text-base font-medium text-primary">${item.price}</p>
                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-[12px]">
                                        <button className="w-[20px] h-[20px] rounded-sm border border-gray-900 flex items-center justify-center text-gray-900 hover:border-primary hover:text-primary transition-colors">
                                            <Minus size={13} strokeWidth={3} />
                                        </button>
                                        <span className="text-base text-gray-900 w-4 text-center">
                                            {item.quantity}
                                        </span>
                                        <button className="w-[20px] h-[20px] rounded-sm border border-gray-900 flex items-center justify-center text-gray-900 hover:border-primary hover:text-primary transition-colors">
                                            <Plus size={13} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bill Details */}
            <section className="space-y-[15px]">
                <h2 className="text-[18px] font-semibold text-gray-900">Bill details</h2>
                <div className="space-y-4 text-gray-500 text-sm">
                    <div className="flex justify-between items-center">
                        <span>Item Total</span>
                        <span>$799.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            <span>Delivery Fee | 12.9 kms</span>
                            <Info size={16} />
                        </div>
                        <span>$131.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            <span>Taxes and Charges</span>
                            <Info size={16} />
                        </div>
                        <span>$2.0</span>
                    </div>
                </div>

                {/* Coupon Success Banner */}
                <div className="bg-primary/20 text-primary text-base p-4 rounded-md flex items-center gap-3 font-medium">
                    <TicketPercent width={19} height={19} />
                    Coupon Applied
                </div>

                <div className="space-y-[15px]">
                    <div className="flex justify-between items-center text-sm text-gray-500 pt-[15px]">
                        <span>Total</span>
                        <span>$11,400.00</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500 pb-[15px]">
                        <span>Discount</span>
                        <span>$4000.00</span>
                    </div>
                    <div className="flex justify-between items-center text-[24px] font-medium text-gray-900">
                        <span>Total</span>
                        <span>$7,400.00</span>
                    </div>
                </div>

                <Button
                    variant="primary"
                    className="w-full h-[54px] rounded-[10px] text-base font-medium shadow-lg shadow-primary/20 mt-[15px]">
                    Place Order
                </Button>
            </section>
        </div>
    )
}
