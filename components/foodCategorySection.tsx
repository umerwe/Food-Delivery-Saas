"use client"
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { useRouter } from 'next/navigation';

const categories = [
    { name: 'Pizza', image: '/pizza.png' },
    { name: 'Burger', image: '/burger.png' },
    { name: 'Sub-sandiwch', image: '/sub.png' },
    { name: 'Chowmein', image: '/chowmein.png' },
    { name: 'Steak', image: '/steak.png' },
    { name: 'Steak', image: '/steak.png' },
    { name: 'Steak', image: '/steak.png' },
    { name: 'Pizza', image: '/pizza.png' },
];

const banners = [
    { image: '/promo1.jpg', text: 'Made with fresh, local ingredients and love' },
    { image: '/promo2.jpg', text: 'Made with fresh, local ingredients and love' },
    { image: '/promo3.jpg', text: 'Made with fresh, local ingredients and love' },
];

export default function FoodCategorySection() {
    const router = useRouter();
    return (
        <section className="max-w-[1400px] mx-auto px-6 pt-[80px]">

            {/* Search by Food Header */}
            <div className="flex items-center justify-between mb-[60px]">
                <h2 className="text-[42px] font-semibold text-[#212121]">Search by Food</h2>
                <div className="flex items-center gap-[16.5px]">
                    <Button
                        variant="link"
                        className="text-[#F15A2B] font-bold text-lg p-0"
                        onClick={() => router.push("/details")}
                    >
                        View All
                        <ChevronRight className='w-[10px] h-[16px]' strokeWidth={3} />
                    </Button>
                    <div className="flex gap-2">
                        {/* Custom styled Shadcn navigation triggers would go here if not using standard ones */}
                        <div className="w-[76px] h-[76px] rounded-full bg-[#F15A2B] flex items-center justify-center text-white shadow-lg shadow-[#FFB20E4A] cursor-pointer">
                            <ChevronLeft size={56} strokeWidth={2} />
                        </div>
                        <div className="w-[76px] h-[76px] rounded-full bg-[#F15A2B] flex items-center justify-center text-white shadow-lg shadow-[#FFB20E4A] cursor-pointer">
                            <ChevronRight size={56} strokeWidth={2} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Carousel */}
            <Carousel className="w-full">
                <CarouselContent className="">
                    {categories.map((item, index) => (
                        <CarouselItem
                            key={index}
                            onClick={() => router.push("/details")}
                            className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5"
                        >
                            <div className="flex flex-col items-center gap-4 group cursor-pointer">
                                <div className="relative w-[218px] h-[218px] rounded-full overflow-hidden border-4 border-transparent group-hover:border-[#F15A2B] transition-all">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="text-lg font-bold text-gray-800">{item.name}</span>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            <div className="flex justify-end mt-[60px] mb-[80px]">
                <Button
                    variant="primary"
                    onClick={()=> router.push("/details")}
                >
                    Order Now
                </Button>
            </div>

            {/* Promotional Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {banners.map((banner, index) => (
                    <div onClick={()=> router.push("/details")} key={index} className="space-y-4">
                        <div className="relative aspect-4/3 rounded-[20px] overflow-hidden shadow-md">
                            <Image
                                src={banner.image}
                                alt="Promotion"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <p className="text-[#424242] text-[22px] font-semibold leading-tight">
                            {banner.text}
                        </p>
                    </div>
                ))}
            </div>

        </section>
    );
}