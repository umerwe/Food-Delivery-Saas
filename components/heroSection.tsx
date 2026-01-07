import Image from 'next/image';
import { Search, ShoppingBag, Bike, MapPin } from 'lucide-react';

const HeroSection = () => {
    return (
        <main className="relative h-[600px] w-full flex items-center justify-center">
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero.png"
                    alt="Hero Pizza Background"
                    fill
                    className="object-cover brightness-75"
                    priority
                />
            </div>

            <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center ml-0 md:ml-20">
                <h1 className="text-white text-5xl md:text-7xl font-extrabold mb-2 drop-shadow-md">
                    Are you starving?
                </h1>
                <p className="text-white text-[22px] font-medium mb-8">
                    Within a few clicks, find meals that are accessible near you
                </p>

                {/* Search Card */}
                <div className="bg-white rounded-2xl shadow-xl w-full p-6 md:p-8">
                    {/* Tabs */}
                    <div className="flex gap-4 mb-6">
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#F17228]/10 text-[#F17228] rounded-md font-bold">
                            <Bike size={20} />
                            Delivery
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-[#757575] font-bold hover:bg-gray-50 rounded-md transition-all">
                            <ShoppingBag size={20} />
                            Pickup
                        </button>
                    </div>

                    {/* Input Row */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative grow my-auto">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <MapPin size={20} className="text-primary" />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter Your Address"
                                className="w-full bg-[#F5F5F5] border-none rounded-xl h-[49px] pl-12 pr-4 text-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                        <button className="bg-primary hover:bg-[#d94e24] text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                            <Search size={18} strokeWidth={3} />
                            Find Food
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default HeroSection