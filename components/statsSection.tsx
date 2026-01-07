import { montserrat } from "@/lib/fonts";

const stats = [
  { label: "Happy Customers", value: "2M+" },
  { label: "Customer Satisfaction", value: "98%" },
  { label: "Our Branches", value: "20+" },
  { label: "Total Employees", value: "100+" },
];

export default function Stats() {
  return (
    <section className={`max-w-6xl mx-auto py-16 px-4 ${montserrat.className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-primary">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex flex-col gap-[12px]">
            <span className="text-[56px] font-bold leading-[66%] h-[66px]">
              {stat.value}
            </span>
            <span className="font-semibold text-lg leading-[30%]">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}