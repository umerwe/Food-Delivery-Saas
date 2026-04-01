import { montserrat } from "@/lib/fonts";

const stats = [
  { label: "Happy Customers", value: "2M+" },
  { label: "Customer Satisfaction", value: "98%" },
  { label: "Our Branches", value: "20+" },
  { label: "Total Employees", value: "100+" },
];

export default function Stats() {
  return (
    <section className={`max-w-6xl mx-auto py-12 md:py-16 px-4 ${montserrat.className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center text-primary">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 md:gap-3">
            
            {/* VALUE */}
            <span className="
              text-3xl sm:text-4xl md:text-[56px] 
              font-bold 
              leading-tight md:leading-[66%]
              h-auto md:h-[66px]
            ">
              {stat.value}
            </span>

            {/* LABEL */}
            <span className="
              text-sm sm:text-base md:text-lg 
              font-semibold 
              leading-normal md:leading-[30%]
            ">
              {stat.label}
            </span>

          </div>
        ))}
      </div>
    </section>
  );
}