"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Mail, MapPin, ShieldCheck, Store } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { useDomainContext } from "@/hooks/useDomainContext";
import { useHome } from "@/hooks/useHome";
import { DEFAULT_BRANDING } from "@/config/default-branding";
import { formatDisplayAddress } from "@/lib/address-display";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getTextField = (record: unknown, keys: string[]) => {
  if (!isRecord(record)) return null;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
};

const getContactEmail = (record: unknown) => {
  if (!isRecord(record)) return null;

  return (
    getTextField(record.contactInfo, ["email", "adminEmail"]) ||
    getTextField(record, ["email", "adminEmail"])
  );
};

const DetailCard = ({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) => (
  <div className="rounded-2xl bg-white p-4 shadow-sm shadow-gray-100/60">
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
      {label}
    </p>
    {href ? (
      <a
        href={href}
        className="mt-2 block break-words text-sm font-semibold text-gray-900 transition-colors hover:text-primary"
      >
        {value}
      </a>
    ) : (
      <p className="mt-2 break-words text-sm font-semibold text-gray-900">{value}</p>
    )}
  </div>
);

const ImpressumPage = () => {
  const t = useTranslations("legal.impressum");
  const { user, restaurantId: authRestaurantId, loading: authLoading } = useAuth();
  const { context: domainContext, loading: domainLoading } = useDomainContext();
  const { branding: fallbackBranding } = useBranding();
  const [urlContext, setUrlContext] = useState({ restaurantId: "", branchId: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setUrlContext({
      restaurantId: params.get("restaurantId") || "",
      branchId: params.get("branchId") || "",
    });
  }, []);

  const restaurantId = useMemo(
    () =>
      urlContext.restaurantId ||
      resolveHomeRestaurantId(user, authRestaurantId) ||
      domainContext?.restaurantId ||
      "",
    [authRestaurantId, domainContext?.restaurantId, urlContext.restaurantId, user],
  );
  const branchId = useMemo(
    () => urlContext.branchId || resolveHomeBranchId(user) || domainContext?.branchId || "",
    [domainContext?.branchId, urlContext.branchId, user],
  );

  const homeQuery = useHome(restaurantId, branchId || null, Boolean(restaurantId));
  const homeData = homeQuery.data?.data;
  const restaurant = homeData?.restaurant;
  const branch = homeData?.branch;
  const branding = homeData?.branding ?? fallbackBranding ?? DEFAULT_BRANDING;

  const restaurantName =
    getTextField(restaurant, ["legalBusinessName", "businessName", "name"]) ||
    branding.restaurantName ||
    t("fallbackRestaurantName");
  const tradeName = getTextField(restaurant, ["name"]);
  const ownerName = getTextField(restaurant, ["ownerName", "owner", "representativeName"]);
  const taxNumber = getTextField(restaurant, ["taxNumber", "vatNumber", "vatId", "taxId"]);
  const registrationNumber = getTextField(restaurant, [
    "registrationNumber",
    "companyRegistrationNumber",
    "commercialRegisterNumber",
  ]);
  const branchName = getTextField(branch, ["name"]);
  const restaurantEmail = getContactEmail(restaurant);
  const branchEmail = getContactEmail(branch);
  const branchAddress = formatDisplayAddress(branch?.address ?? branch, {
    includeRegionCountry: true,
  });
  const isLoading = authLoading || domainLoading || homeQuery.isLoading;

  return (
    <div className="min-h-screen bg-[#F7F7F7] px-6 py-12 md:px-12 lg:px-20">
      <div className="mx-auto max-w-[1080px]">
        <div className="rounded-[28px] bg-white p-6 shadow-sm shadow-gray-100 md:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[720px]">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#E74C3C]">
                {t("eyebrow")}
              </p>
              <h1 className="mt-3 text-[32px] font-semibold text-gray-900 md:text-[36px]">
                {t("title")}
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                {t("description")}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9F9F9] p-4 text-sm text-gray-600 lg:min-w-[260px]">
              <div className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                <ShieldCheck className="h-4 w-4 text-[#E74C3C]" />
                {t("sourceTitle")}
              </div>
              <p>{t("sourceDescription")}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm shadow-gray-100 md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF3F1] text-[#E74C3C]">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[20px] font-semibold text-gray-900">
                  {t("operatorTitle")}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t("operatorDescription")}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailCard label={t("legalName")} value={restaurantName} />
              {tradeName && tradeName !== restaurantName ? (
                <DetailCard label={t("tradeName")} value={tradeName} />
              ) : null}
              {ownerName ? <DetailCard label={t("ownerName")} value={ownerName} /> : null}
              {taxNumber ? <DetailCard label={t("taxNumber")} value={taxNumber} /> : null}
              {registrationNumber ? (
                <DetailCard label={t("registrationNumber")} value={registrationNumber} />
              ) : null}
              {restaurantEmail ? (
                <DetailCard
                  label={t("restaurantAdminEmail")}
                  value={restaurantEmail}
                  href={`mailto:${restaurantEmail}`}
                />
              ) : null}
            </div>
          </section>

          <aside className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm shadow-gray-100 md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF3F1] text-[#E74C3C]">
                <Store className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[20px] font-semibold text-gray-900">
                  {t("branchTitle")}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t("branchDescription")}</p>
              </div>
            </div>

            <div className="space-y-4">
              {branchName ? <DetailCard label={t("branchName")} value={branchName} /> : null}
              {branchAddress ? (
                <div className="rounded-2xl bg-[#F9F9F9] p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                    <MapPin className="h-4 w-4 text-[#E74C3C]" />
                    {t("businessAddress")}
                  </div>
                  <p className="text-sm font-semibold leading-6 text-gray-900">
                    {branchAddress}
                  </p>
                </div>
              ) : null}
              {branchEmail ? (
                <div className="rounded-2xl bg-[#F9F9F9] p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                    <Mail className="h-4 w-4 text-[#E74C3C]" />
                    {t("branchAdminEmail")}
                  </div>
                  <a
                    href={`mailto:${branchEmail}`}
                    className="break-words text-sm font-semibold text-gray-900 transition-colors hover:text-primary"
                  >
                    {branchEmail}
                  </a>
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        {!isLoading && !restaurant && !branch ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500">
            {t("missingDetails")}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export { ImpressumPage };
