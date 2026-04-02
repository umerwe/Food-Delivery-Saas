"use client";

import Image from "next/image";

export default function TeamSection() {
  const team = [
    {
      name: "Julian Sterling",
      role: "Founder & CEO",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=800",
    },
    {
      name: "Elena Rossi",
      role: "Executive Chef",
      image:
        "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?q=80&w=800",
    },
    {
      name: "Marcus Chen",
      role: "Head of Operations",
      image:
        "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800",
    },
    {
      name: "Sarah Jenkins",
      role: "Logistics Director",
      image:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=800",
    },
  ];

  return (
    <section className="w-full py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Heading */}
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Meet Our Team
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            The visionaries behind the flavor.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <div key={index}>
              
              {/* Image */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-200">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover object-top"
                />
              </div>

              {/* Info */}
              <h3 className="mt-4 text-sm font-semibold text-gray-900">
                {member.name}
              </h3>

              <p className="text-xs text-[#FF5A2C] mt-1">
                {member.role}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}