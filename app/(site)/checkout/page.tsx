import React from 'react';
import Image from 'next/image';
import {
    MapPin,
    Plus,
    Minus,
    CreditCard,
    Info,
    ChevronRight,
    CircleSlash2,
    TicketPercent
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const cartItems = [
    { id: 1, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
    { id: 2, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
    { id: 3, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
    { id: 4, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
];

export default function CheckoutPage() {
    return (
        <div className="max-w-7xl mx-auto mt-[63px] mb-[113px] px-4">

            {/* 1. Top Toggle (Delivery/Pickup) */}
            <div className="flex justify-start mb-[88px]">
                <div className="bg-[#F3F3F3] p-1 rounded-full flex w-full max-w-[428px]">
                    <button className="flex-1 py-3 px-6 bg-primary text-white rounded-full font-medium text-base shadow-sm">
                        Delivery
                    </button>
                    <button className="flex-1 py-3 px-6 text-gray-500 font-medium text-base">
                        Pickup
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                {/* LEFT COLUMN: Main Form (8 Cols) */}
                <div className="lg:col-span-7 space-y-[38px]">

                    {/* Delivery Address Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <MapPin className="text-primary" size={28} />
                            <h2 className="text-[24px] font-semibold text-gray-900">Delivery address</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
                            {/* Active Address Card */}
                            <Card className="bg-primary border-none rounded-[16px] p-6 text-white cursor-pointer transition-transform hover:scale-[1.02]">
                                <div className="flex flex-col gap-4">
                                    <MapPin size={30} />
                                    <p className="text-base font-medium leading-relaxed">
                                        Dno. 12-34-12, XYC Apartments, DOOR Colony, Hyderabad, Telangana
                                    </p>
                                </div>
                            </Card>

                            {/* Inactive Dashed Address Card */}
                            <Card className="bg-white border-2 border-dashed border-primary rounded-[16px] p-6 text-gray-700 cursor-pointer transition-all hover:border-primary">
                                <div className="flex flex-col gap-4">
                                    <MapPin size={30} className="text-gray-400" />
                                    <p className="text-base font-medium leading-relaxed text-gray-700">
                                        Dno. 12-34-12, XYC Apartments, DOOR Colony, Hyderabad, Telangana
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </section>

                    {/* Note Section */}
                    <section className="space-y-[20px] mt-[6px]">
                        <h3 className="text-lg font-medium text-gray-900">Any Note for us?</h3>
                        <Textarea
                            placeholder="Type you note here"
                            className="min-h-[120px] placeholder:text-gray-400 bg-white border-3 border-gray-400 rounded-[12px] pl-[25px] p-4 text-sm"
                        />
                    </section>

                    {/* Customer Details Form */}
                    <section className="space-y-[36px] -mt-[20px]">
                        <h2 className="text-[24px] font-semibold text-gray-900 pt-[8px] border-b-2 border-gray-300">Customer Details</h2>
                        <div className="space-y-[36px]">
                            <div className="space-y-[16px]">
                                <label className="text-lg font-medium text-gray-900">Name</label>
                                <Input
                                    placeholder="Jhon Smith"
                                    className="h-[55px] rounded-sm text-gray-900 placeholder:text-gray-900 bg-white focus-visible:bg-white border-3 border-gray-300 mt-[16px]"

                                />
                            </div>
                            <div className="space-y-[16px]">
                                <label className="text-lg font-medium text-gray-900">Contact</label>
                                <Input
                                    placeholder="+92 3364 236672"
                                    className="h-[55px] rounded-sm text-gray-900 placeholder:text-gray-900 bg-white focus-visible:bg-white border-3 border-gray-300 mt-[16px]"
                                />
                            </div>
                            <div className="space-y-[16px]">
                                <label className="text-lg font-medium text-gray-900">Email</label>
                                <Input
                                    placeholder="Jhonsmith@gmail.com"
                                    className="h-[55px] rounded-sm text-gray-700 placeholder:text-gray-900 bg-white focus-visible:bg-white border-3 border-gray-300 mt-[16px]"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Payment Selection */}
                    <section className="space-y-[25px]">
                        <h2 className="text-[24px] font-semibold text-gray-900 pt-[8px] border-b-2 border-gray-300">Select Payment Method</h2>

                        <div className="space-y-3">
                            {/* Credit Cards (Selected) */}
                            <div className="flex items-center justify-between p-5 bg-[#F9F9F9] rounded-[12px] border border-gray-100 cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                                    </div>
                                    <span className="text-sm text-gray-800">Credit Cards</span>
                                </div>
                            </div>

                            {/* PayPal (Unselected) */}
                            <div className="flex items-center justify-between p-5 bg-white rounded-[12px] border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                    <span className="text-sm text-gray-800">PayPal</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-[45px] h-[45px] rounded-[12px] bg-[#E8F1FF] border-none text-blue hover:bg-[#D1E3FF] flex items-center justify-center">
                            <Plus width={24} height={24} />
                        </div>
                    </section>
                </div>


                {/* RIGHT COLUMN: Sidebar (4 Cols) */}
                <div className="lg:col-span-5">
                    <div className="sticky top-10 space-y-[42.63px]">

                        {/* Cart Summary */}
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
                                                <p className="text-sm font-bold text-primary">$ {item.price}</p>
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
                </div>

            </div>
        </div>
    );
}