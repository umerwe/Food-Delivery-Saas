"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { AboutTeamMember } from "@/services/public-content";

type TeamSectionProps = {
  team?: AboutTeamMember[];
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DW";

export default function TeamSection({ team: dynamicTeam }: TeamSectionProps) {
  const t = useTranslations("about.team");

  const fallbackTeam = [
    {
      name: "Julian Sterling",
      role: t("founderRole"),
      imageUrl:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=800",
    },
    {
      name: "Elena Rossi",
      role: t("chefRole"),
      imageUrl:
        "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?q=80&w=800",
    },
    {
      name: "Marcus Chen",
      role: t("operationsRole"),
      imageUrl:
        "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800",
    },
    {
      name: "Sarah Jenkins",
      role: t("logisticsRole"),
      imageUrl:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=800",
    },
  ];
  const team = dynamicTeam?.length ? dynamicTeam : fallbackTeam;

  return (
    <section className="w-full py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">

        {/* Heading */}
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
            {t("title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("description")}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <div key={index}>

              {/* Image */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-200">
                {member.imageUrl ? (
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#FF5A2C]/10 text-2xl font-semibold text-[#FF5A2C]">
                    {getInitials(member.name)}
                  </div>
                )}
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
