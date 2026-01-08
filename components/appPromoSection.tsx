import React from 'react';
import { Star } from 'lucide-react';
import Image from 'next/image';

export default function AppPromo() {
  return (
    <section className="px-4 pt-5 pb-[80px]">
      <div className="max-w-[1400px] mx-auto">
        <div className="relative w-fulloverflow-hidden">
          {/* Background Image */}
          <Image
            src="/banner-bg.png"
            alt="Banner Background"
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
          />

          {/* Phone Mockup - Positioned on left */}
          <div className="absolute -top-8 z-20">
            <div className="w-[200px] md:w-[240px] lg:w-[450px]">
              <img
                src="/banner-mobile.png"
                alt="App Preview"
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="absolute left-10 top-0 h-full flex items-center pr-6 md:pr-12 lg:pr-16 pl-[220px] md:pl-[280px] lg:pl-[320px]">
            <div className="text-white max-w-2xl">
              <h2 className="text-[40px] font-bold mb-6 md:mb-8 leading-[113%] tracking-[0.01em]">
                Great food and lots<br />
                of discounted prices
              </h2>


              <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                {/* Social Proof */}
                <div className="flex flex-col gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-[57.31px] h-[58px] rounded-full border-2 md:border-[3px] border-white overflow-hidden bg-gray-200"
                      >
                        <img
                          src={`https://i.pravatar.cc/150?img=${i}`}
                          alt="Customer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-lg font-bold leading-[100%] tracking-[1%]">Our Happy Customer</span>
                  <div className="flex items-center gap-2">
                    <Star size={16} fill="#FFD700" stroke="#FFD700" className="md:w-5 md:h-5" />
                    <span className="text-lg font-bold leading-[100%] tracking-[1%]">4.8</span>
                    <span className="text-base leading-[100%] tracking-[1%] opacity-90">(1.9k Review)</span>
                  </div>
                </div>
              </div>
              
            </div>

             
          </div>
           <div className="flex flex-col gap-3 absolute right-16 top-1/2 transform -translate-y-1/2">
                <a
                  href="#"
                  className="block transition-transform hover:scale-105 active:scale-95"
                >
                  <img
                    src="/app-store.png"
                    alt="Download on the App Store"
                    className="w-[254.5px] h-[74.04px]"
                  />
                </a>
                <a
                  href="#"
                  className="block transition-transform hover:scale-105 active:scale-95"
                >
                  <img
                    src="/google-play.png"
                    alt="Get it on Google Play"
                    className="w-[254.5px] h-[74.04px]"
                  />
                </a>
              </div>
        </div>
      </div>
    </section>
  );
}