// @refresh reset
import { Star } from 'lucide-react';
import Image from 'next/image';

export default function AppPromo() {
return (
  <section className="px-4 pt-5 pb-[80px]">
    <div className="max-w-[1400px] mx-auto">
      <div className="relative w-full overflow-hidden rounded-[20px]">

        <Image
          src="/banner-bg.png"
          alt="Banner Background"
          width={1920}
          height={1080}
          className="w-full h-[560px] md:h-full object-cover"
        />

        <div className="
          absolute
          top-0 md:-top-3
          left-1/2 md:left-0
          -translate-x-1/2 md:translate-x-0
          z-20
        ">
          <div className="w-[180px] sm:w-[250px] md:w-[240px] lg:w-[430px]">
            <img
              src="/banner-mobile.png"
              alt="App Preview"
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>
        </div>

        <div className="
          absolute top-0 h-full flex items-center
          px-4 sm:px-6
          md:left-10 md:pr-12 md:pl-[260px]
          lg:pr-16 lg:pl-[320px]
          w-full md:w-auto
          pt-30 md:pt-0
        ">
          <div className="text-white max-w-xl md:max-w-2xl text-center md:text-left">

            <h2 className="text-[22px] sm:text-[28px] md:text-[40px] font-bold mb-4 md:mb-8 leading-tight">
              Great food and lots<br className="hidden sm:block" />
              of discounted prices
            </h2>

            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 justify-center md:justify-start">

              <div className="flex justify-center md:justify-start -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-[40px] h-[40px] md:w-[57px] md:h-[58px] rounded-full border-2 md:border-[3px] border-white overflow-hidden bg-gray-200"
                  >
                    <img
                      src={`https://i.pravatar.cc/150?img=${i}`}
                      alt="Customer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center md:items-start">
                <span className="text-sm md:text-lg font-bold">
                  Our Happy Customer
                </span>
                <div className="flex items-center gap-2">
                  <Star size={16} fill="#FFD700" stroke="#FFD700" />
                  <span className="text-sm md:text-lg font-bold">4.8</span>
                  <span className="text-xs md:text-base opacity-90">
                    (1.9k Review)
                  </span>
                </div>
              </div>

            </div>

            <div className="flex md:hidden justify-center gap-3 mt-6">
              <img
                src="/app-store.png"
                className="w-[130px] sm:w-[150px]"
              />
              <img
                src="/google-play.png"
                className="w-[130px] sm:w-[150px]"
              />
            </div>

          </div>
        </div>

        <div className="
          hidden md:flex
          flex-col gap-3 absolute right-16 top-1/2 transform -translate-y-1/2
        ">
          <img src="/app-store.png" className="w-[220px] lg:w-[254px]" />
          <img src="/google-play.png" className="w-[220px] lg:w-[254px]" />
        </div>

      </div>
    </div>
  </section>
);
}
