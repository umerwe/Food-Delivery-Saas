import Image from 'next/image';
import { useTranslations } from "next-intl";

const features = [
  {
    id: 1,
    titleKey: "easyTitle",
    descKey: "easyDescription",
    img: "/whychooseus1.png",
  },
  {
    id: 2,
    titleKey: "deliveryTitle",
    descKey: "deliveryDescription",
    img: "/whychooseus2.png",
  },
  {
    id: 3,
    titleKey: "qualityTitle",
    descKey: "qualityDescription",
    img: "/whychooseus3.png",
  },
] as const;

const FeatureCard = ({
  title,
  desc,
  img,
}: {
  title: string;
  desc: string;
  img: string;
}) => (
  <div className="flex flex-col items-center text-center text-gray-800 p-4">
    
    {/* IMAGE */}
    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mb-4">
      <Image src={img} alt={title} fill className="object-contain object-top" />
    </div>

    {/* TITLE */}
    <h3 className="
      text-xl sm:text-2xl md:text-[28px] 
      font-bold 
      leading-tight md:leading-[30px] 
      mb-2
    ">
      {title}
    </h3>

    {/* DESCRIPTION */}
    <p className="
      text-sm sm:text-base md:text-lg 
      leading-relaxed 
      max-w-full md:max-w-[314px]
    ">
      {desc}
    </p>
  </div>
);

export default function WhyChooseUs() {
  const t = useTranslations("home.whyChooseUs");

  return (
    <section className="py-12 md:py-[80px] px-4 max-w-[1400px] mx-auto">
      
      {/* HEADING */}
      <h2 className="
        text-2xl sm:text-3xl md:text-[42px] 
        font-semibold 
        text-center 
        leading-tight md:leading-[30px] 
        mb-10 md:mb-[60px]
      ">
        {t("title")}
      </h2>

      {/* GRID */}
      <div className="
        grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 
        gap-10 sm:gap-12 md:gap-[135px]
      ">
        {features.map((f) => (
          <FeatureCard key={f.id} title={t(f.titleKey)} desc={t(f.descKey)} img={f.img} />
        ))}
      </div>

    </section>
  );
}
