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

const FeatureCard = ({ title, desc, img }: { title: string; desc: string; img: string }) => (
  <div className="flex flex-col items-center text-center text-gray-800 p-4">
    <div className="relative w-48 h-48 mb-4">
      <Image src={img} alt={title} fill className="object-contain" />
    </div>
    <h3 className="text-[28px] font-bold leading-[30px] mb-2">
      {title}
    </h3>
    <p className="max-w-[314px] text-lg leading-relaxed">{desc}</p>
  </div>
);

export default function WhyChooseUs() {
  return (
    <section className="py-[80px] px-4 max-w-7xl mx-auto">
      <h2 className="text-[42px] font-semibold text-center leading-[30px] mb-[60px]">Why Choose Us</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[135px]">
        {features.map((f) => (
          <FeatureCard key={f.id} {...f} />
        ))}
      </div>
    </section>
  );
}