import Image from "next/image";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Clock } from "lucide-react";

export default function ReserveTablePage() {
    return (
        <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/reserve-table-bg.jpg"
                    alt="Restaurant background"
                    fill
                    className="object-cover opacity-12"
                    priority
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-12 py-12">
                {/* Left Column: Text Content */}
                <div className="text-gray-900 space-y-[12px] max-w-[500px] mt-10">
                    <h1 className="text-[60px] font-bold leading-tight">
                        Taste The{" "}
                        <span className="text-primary block">Extraordinary</span>
                    </h1>
                    <p className="text-lg leading-relaxed text-gray-600">
                        with every bite — a perfect balance of flavor and freshness. Crafted
                        with premium ingredients, each moment becomes a delicious experience.
                        Indulge in a taste that goes beyond the ordinary and satisfies your
                        senses.
                    </p>
                    <div className="flex items-center gap-2 mt-[23px]">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-[17px]">4.9</span>
                        <span className="text-gray-500">(2.7k reviews)</span>
                    </div>
                </div>

                {/* Right Column: Reservation Form */}
                <div className="bg-white rounded-[20px] p-[40px] shadow-2xl w-full max-w-[618px] mx-auto lg:ml-auto">
                    <div className="space-y-[8px] mb-[27px]">
                        <h2 className="text-[24px] font-semibold text-gray-900">
                            Reserve a Table
                        </h2>
                        <p className="text-gray-500">
                            Fill in the details below to book your table.
                        </p>
                    </div>

                    <form className="space-y-6">
                        {/* Date and Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Date
                                </label>
                                <div className="relative mt-[6px]">
                                    <Input
                                        type="text"
                                        placeholder="10/12/2025"
                                        className="h-12 pl-4 pr-10 rounded-full bg-[#FAFAF9]"
                                    />
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Time
                                </label>
                                <div className="relative mt-[6px]">
                                    <Input
                                        type="text"
                                        placeholder="10:00"
                                        className="h-12 pl-4 pr-10 rounded-full bg-[#FAFAF9]"
                                    />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Number of Guests */}
                        <div>
                            <label className="text-base font-medium text-gray-700">
                                Number of Guests
                            </label>
                            <div className="grid grid-cols-4 gap-3 mt-[6px]">
                                <button
                                    type="button"
                                    className="h-[52px] rounded-full bg-primary text-white font-semibold text-base"
                                >
                                    2
                                </button>
                                <button
                                    type="button"
                                    className="h-[52px] rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-base transition-colors"
                                >
                                    3
                                </button>
                                <button
                                    type="button"
                                    className="h-[52px] rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-base transition-colors"
                                >
                                    4
                                </button>
                                <button
                                    type="button"
                                    className="h-[52px] rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-base transition-colors"
                                >
                                    5+
                                </button>
                            </div>
                        </div>

                        {/* Contact Details Title */}
                        <h3 className="text-[20px] font-bold text-gray-900 pt-4">
                            Contact Details
                        </h3>

                        {/* Full Name and Phone Number */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <Input placeholder="John Doe" className="h-12 mt-[6px] bg-[#FAFAF9] placeholder:text-gray-400 rounded-full border-3 border-gray-200" />
                            </div>
                            <div >
                                <label className="text-sm font-medium text-gray-700">
                                    Phone Number
                                </label>
                                <Input placeholder="4385743875639" className="h-12 mt-[6px] bg-[#FAFAF9] placeholder:text-gray-400 rounded-full border-3 border-gray-200" />
                            </div>
                        </div>

                        {/* Special Request */}
                        <div>
                            <label className="text-sm font-medium text-gray-400">
                                Special Request (Optional)
                            </label>
                            <Textarea
                                placeholder="Alerges, High Chair, birthday, celebration"
                                className="resize-none h-[100px] mt-[6px] bg-[#FAFAF9] placeholder:text-gray-400 rounded-lg border-3 border-gray-200"
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            variant="primary"
                            className="w-full"
                        >
                            Confirm Reservation
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}