"use client"

import Image from 'next/image';
import {
    Star,
    MapPin,
    Clock,
    Navigation,
    Search,
    IndianRupee,
    Plus,
    Minus,
    Bike,
    Store,
    CircleArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatMoney } from "@/lib/money";

const categories = ["All", "Burgers", "Pizza", "Bread", "Chiffon & Rolls", "Donut", "Pastry & Danish", "Cakes", "Drinks"];

const menuItems = [
    { id: 1, name: "MENU BEEF BBQ - 1 VIANDE", price: 19.30, desc: "Pain spécial, steak haché, cheddar, oignons rouges, tranche de tomates, salade, cornichon, sauce goût barbecue.", img: "/menu-item.jpg" },
    { id: 2, name: "MENU BEEF BBQ - 1 VIANDE", price: 19.30, desc: "Pain spécial, steak haché, cheddar, oignons rouges, tranche de tomates, salade, cornichon, sauce goût barbecue.", img: "/menu-item.jpg" },
    { id: 3, name: "MENU BEEF BBQ - 1 VIANDE", price: 19.30, desc: "Pain spécial, steak haché, cheddar, oignons rouges, tranche de tomates, salade, cornichon, sauce goût barbecue.", img: "/menu-item.jpg" },
    { id: 4, name: "MENU BEEF BBQ - 1 VIANDE", price: 19.30, desc: "Pain spécial, steak haché, cheddar, oignons rouges, tranche de tomates, salade, cornichon, sauce goût barbecue.", img: "/menu-item.jpg" },
    { id: 5, name: "MENU BEEF BBQ - 1 VIANDE", price: 19.30, desc: "Pain spécial, steak haché, cheddar, oignons rouges, tranche de tomates, salade, cornichon, sauce goût barbecue.", img: "/menu-item.jpg" },
];

const cartItems = [
    { id: 1, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
    { id: 2, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
    { id: 3, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
    { id: 4, name: "Garden Vegetable Salad", price: 30, desc: "Crisp & refreshing from garden", quantity: 1, img: "/cart-item.png" },
];

export function DetailsPage() {
    const router = useRouter();
    const t = useTranslations("productDetails.detailsPage");
    const cartT = useTranslations("cart");
    const checkoutT = useTranslations("checkout");

    return (
        <div className="max-w-[1400px] mx-auto px-4 pt-[25.5px] pb-[108px]">

            <div className="relative w-full h-[300px] md:h-[425.48px] overflow-hidden rounded-[20px]">
                <Image
                    src="/details-img.jpg"
                    alt="McDonald's Header"
                    fill
                    className="object-cover"
                    priority
                />
            </div>
            <div className='mt-[52px] mb-[32px]'>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <h1 className="text-[30px] leading-[36px] font-bold text-gray-900">
                            McDonald's® (Paris Hotel De Ville)
                        </h1>
                        <div className="flex items-center gap-2 text-base font-medium text-gray-600">
                            <div className="flex items-center text-primary">
                                <Star size={18} className='text-gray-900 fill-gray-900' />
                                <span className="ml-1 text-gray-900">{t("stars", { rating: "4.5" })}</span>
                            </div>
                            <span>|</span>
                            <span className="underline cursor-pointer text-primary">{t("reviews", { count: 450 })}</span>
                        </div>
                    </div>

                    <Button onClick={() => router.push('/reservetable')} variant="primary" className="rounded-[8px] h-[50px] w-[228px] px-8 text-base font-semibold">
                        {t("reserveTable")}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 pt-4 border-t border-gray-100">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-gray-700">
                            <IndianRupee size={20} />
                            <span className="text-base font-medium">{t("priceCuisine")}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Navigation size={20} />
                            <span className="text-base font-medium">
                                <span className="text-primary">0.7 km</span> {t("distanceFrom", { place: "Banaras Ghats" })}
                            </span>
                        </div>
                    </div>
                    {/* Column 2 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-gray-700">
                            <MapPin size={20} />
                            <span className="text-base font-medium">{t("branchAddress")}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Clock size={20} />
                            <span className="text-base font-medium">
                                <span className="text-primary">{t("openFrom")}</span> 10:00 - 23:00
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-[16px]">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <Input
                        type="text"
                        placeholder={t("searchMenu")}
                        className='pl-12 h-[50px] bg-[#F9F9F9] border-none rounded-[12px] text-base'
                    />
                </div>
                <Button variant="primary" className='rounded-[12px] h-[50px] w-[184px] text-base font-semibold'>
                    {t("findFood")}
                </Button>
            </div>

            {/* 1. Category Filter Bar */}
            <div className="flex items-center gap-[60px] overflow-x-auto mt-[12px] mb-[59px]">
                {categories.map((category, index) => (
                    <button
                        key={index}
                        className={`text-[18px] whitespace-nowrap pb-2 relative ${index === 0 ? "text-primary font-bold" : "text-gray-900 hover:text-gray-900"
                            }`}
                    >
                        {category}
                        {index === 0 && (
                            <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary"></span>
                        )}
                    </button>
                ))}
            </div>

            {/* 2. Main Content Grid (Menu + Cart) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[60px] pt-0">

                {/* LEFT COLUMN */}
                <div className="space-y-[24px]">
                    {menuItems.map((item) => (
                        <Card key={item.id} className="rounded-none border-none shadow-none flex flex-col md:flex-row gap-6 p-0 overflow-hidden">
                            {/* Text Content */}
                            <div className="flex-1 space-y-[6px]">
                                <h3 className="text-[20px] font-semibold text-gray-900 uppercase leading-tight">
                                    {item.name}
                                </h3>
                                <p className="text-base  text-gray-900">
                                    {formatMoney(item.price, undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                </p>
                                <p className="text-base text-gray-500 leading-[20px] line-clamp-3">
                                    {item.desc}
                                </p>
                            </div>
                            {/* Image Container */}
                            <div className="relative w-full md:w-[275px] h-[158px] shrink-0 rounded-[10px] overflow-hidden order-1 md:order-2 group">
                                <Image
                                    src={item.img}
                                    alt={item.name}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                {/* Add Button Overlay */}
                                <button className="absolute top-3 right-3 w-[36px] h-[36px] bg-primary rounded-full flex items-center justify-center border text-white hover:bg-primary/90">
                                    <Plus size={15} strokeWidth={4} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-1 w-[372px]">
                    <Card className="border-none shadow-none p-0 sticky top-8">
                        <CardContent className="p-0">
                            <h2 className="text-[24px] text-gray-900 mb-[40px]">{cartT("yourOrder")}</h2>

                            {/* Cart Items List */}
                            <div className="space-y-[19px] pb-4 border-b border-gray-200">
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

                            <Separator />

                            {/* Total & Coupon */}
                            <div className="space-y-6 mt-[24px]">
                                <div className="flex justify-between items-center text-[22px] font-medium text-gray-900 mb-[55px]">
                                    <span>{t("totalCost")}</span>
                                    <span>$120</span>
                                </div>

                                <div className="relative pb-[35px] border-b border-gray-200">
                                    <Input
                                        placeholder={t("couponPlaceholder")}
                                        className="pl-[26px] pr-18 border border-gray-200 placeholder:text-gray-800"
                                    />
                                    <button className="absolute right-[36px] top-0 translate-y-1/2 text-primary hover:text-primary/80">
                                        <CircleArrowRight size={24} />
                                    </button>
                                </div>
                            </div>

                            <Separator />

                            {/* Delivery/Pickup Toggles */}
                            <div className="grid grid-cols-2 gap-4 mt-[17px] mb-[48px]">
                                {/* Delivery Option (Active) */}
                                <button className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#F9F9F9] border-2 border-gray-200 transition-all">
                                    <Bike size={28} className="text-primary" />
                                    <span className="text-base font-semibold text-gray-900 mt-2">{checkoutT("delivery")}</span>
                                    <span className="text-[15px] text-gray-900 font-medium">{t("startsAt", { time: "17:50" })}</span>
                                </button>
                                {/* Pickup Option (Inactive) */}
                                <button className="flex flex-col items-center justify-center p-4 rounded-[16px] bg-white border-2 border-transparent hover:border-gray-200 transition-all">
                                    <Store size={28} className="text-gray-400" />
                                    <span className="text-base font-semibold text-gray-400 mt-2">{checkoutT("pickup")}</span>
                                    <span className="text-[15px] text-gray-400 font-medium">{t("startsAt", { time: "16:50" })}</span>
                                </button>
                            </div>

                            {/* Checkout Button */}
                            <Button
                                variant="primary"
                                onClick={() => router.push("/checkout")}
                                className='w-full rounded-[10px] text-[24px]'
                            >
                                {cartT("proceedToCheckout")}
                            </Button>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
