import Image from 'next/image';

const features = [
  {
    id: 1,
    title: "Easy To Order",
    desc: "You only need a few steps in ordering food",
    img: "/whychooseus1.png",
  },
  {
    id: 2,
    title: "Fastest Delivery",
    desc: "Delivery that is always ontime even faster",
    img: "/whychooseus2.png",
  },
  {
    id: 3,
    title: "Best Quality",
    desc: "Not only fast for us quality is also number one",
    img: "/whychooseus3.png",
  },
];

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
        Why Choose Us
      </h2>

      {/* GRID */}
      <div className="
        grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 
        gap-10 sm:gap-12 md:gap-[135px]
      ">
        {features.map((f) => (
          <FeatureCard key={f.id} {...f} />
        ))}
      </div>

    </section>
  );
}