// @refresh reset
import Image from "next/image";
import { useTranslations } from "next-intl";

const ASSET_BASE = "/app-promo";

export default function AppPromo() {
  const t = useTranslations("home.appPromo");

  const tSafe = (key: string, fallback: string) => {
    try {
      const value = (t as unknown as (translationKey: string) => string)(key);
      return value && value !== key ? value : fallback;
    } catch {
      return fallback;
    }
  };

  const features = [
    tSafe("features.exclusiveOffers", "Exclusive app offers"),
    tSafe("features.realTimeTracking", "Real-time tracking"),
    tSafe("features.fasterOrdering", "Faster ordering"),
    tSafe("features.easyReordering", "Easy reordering"),
  ];

  return (
    <section className="px-4 pt-5 pb-[80px]">
      <div className="mx-auto max-w-[1680px]">
        <div className="relative isolate min-h-[665px] overflow-hidden rounded-[20px] bg-[#fff7f7] px-5 py-8 shadow-[0_18px_50px_rgba(224,62,62,0.08)] sm:min-h-[705px] sm:px-7 lg:h-[320px] lg:min-h-0 lg:p-0 xl:h-[360px] 2xl:h-[380px]">
          <div className="absolute inset-0 -z-10 bg-[#fff7f7]" />
          <div className="absolute -left-[80px] -top-[120px] -z-10 h-[380px] w-[640px] rounded-full bg-[#ffe6e6]/65 blur-3xl" />
          <div className="absolute left-[35%] top-[-170px] -z-10 h-[430px] w-[760px] rounded-full bg-white/80 blur-3xl" />
          <div className="absolute bottom-[-160px] right-[-140px] -z-10 h-[460px] w-[760px] rounded-full bg-[#ffecec]/85 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-[#ffe9e9]" />

          <Image
            src={`${ASSET_BASE}/ingredients.png`}
            alt=""
            width={960}
            height={410}
            aria-hidden="true"
            className="pointer-events-none absolute left-[2.6%] top-[10%] z-10 hidden h-auto w-[45%] max-w-[760px] lg:block"
          />

          <Image
            src={`${ASSET_BASE}/phone.png`}
            alt={tSafe("appPreviewAlt", "App preview")}
            width={820}
            height={610}
            className="pointer-events-none absolute left-[6.4%] top-[5.8%] z-20 hidden h-auto w-[30.5%] max-w-[520px] select-none lg:block xl:w-[29.5%] 2xl:w-[28.7%]"
          />

          <div className="absolute left-[41.5%] top-1/2 z-30 hidden w-[39%] max-w-[620px] -translate-y-1/2 lg:block xl:left-[43.7%]">
            <p className="text-[14px] font-extrabold uppercase leading-none tracking-[0.12em] text-[#d71920] xl:text-[17px]">
              {tSafe("eyebrow", "Download our app")}
            </p>

            <h2 className="mt-4 max-w-[620px] text-[30px] font-black leading-[1.08] tracking-[-0.045em] text-[#101014] xl:text-[38px] 2xl:text-[42px]">
              {tSafe("headlineLineOne", "Great food, greater deals")}
              <br />
              {tSafe("headlineLineTwo", "on the app")}
            </h2>

            <div className="mt-7 grid max-w-[560px] grid-cols-2 gap-x-8 gap-y-5 xl:gap-x-14">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-[15px] font-semibold text-[#6c6c73] xl:text-[18px]">
                  <span className="flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border-[3px] border-[#ef5b61] text-[#ef5b61]">
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
                      <path d="M1.4 4.45 4.18 7.1 9.6 1.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="whitespace-nowrap">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute right-[4.2%] top-1/2 z-30 hidden w-[160px] -translate-y-1/2 flex-col gap-4 lg:flex xl:right-[7.2%] xl:w-[200px] xl:gap-5 2xl:right-[8.8%] 2xl:w-[212px]">
            <Image
              src={`/app-store-badge.png`}
              alt={tSafe("appStoreAlt", "Download on the App Store")}
              width={320}
              height={96}
              className="h-auto w-full select-none rounded-[8px] overflow-hidden"
            />
            <Image
              src={`/google-play-badge.png`}
              alt={tSafe("googlePlayAlt", "Get it on Google Play")}
              width={320}
              height={96}
              className="h-auto w-full select-none rounded-[8px] overflow-hidden"
            />
          </div>

          <div className="relative z-20 flex flex-col items-center text-center lg:hidden">
            <div className="relative mb-5 h-[270px] w-full max-w-[430px] sm:h-[310px]">
              <Image
                src={`${ASSET_BASE}/promo-ingredients.png`}
                alt=""
                width={960}
                height={410}
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-2 h-auto w-[520px] max-w-none -translate-x-1/2 opacity-85"
              />
              <Image
                src={`${ASSET_BASE}/promo-phones.png`}
                alt={tSafe("appPreviewAlt", "App preview")}
                width={820}
                height={610}
                className="pointer-events-none absolute left-1/2 top-0 h-auto w-[360px] max-w-none -translate-x-1/2 select-none sm:w-[420px]"
              />
            </div>

            <p className="text-[13px] font-extrabold uppercase leading-none tracking-[0.14em] text-[#d71920]">
              {tSafe("eyebrow", "Download our app")}
            </p>

            <h2 className="mt-4 max-w-[460px] text-[31px] font-black leading-[1.08] tracking-[-0.045em] text-[#101014] sm:text-[38px]">
              {tSafe("headlineLineOne", "Great food, greater deals")}
              <br />
              {tSafe("headlineLineTwo", "on the app")}
            </h2>

            <div className="mt-7 grid w-full max-w-[420px] grid-cols-1 gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-center justify-center gap-3 text-[15px] font-semibold text-[#6c6c73] sm:justify-start">
                  <span className="flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border-[3px] border-[#ef5b61] text-[#ef5b61]">
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
                      <path d="M1.4 4.45 4.18 7.1 9.6 1.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex w-full max-w-[340px] flex-col gap-3 sm:max-w-[420px] sm:flex-row sm:justify-center">
              <Image
                src={`${ASSET_BASE}/app-store-badge.png`}
                alt={tSafe("appStoreAlt", "Download on the App Store")}
                width={320}
                height={96}
                className="mx-auto h-auto w-[170px] select-none sm:w-[190px]"
              />
              <Image
                src={`${ASSET_BASE}/google-play-badge.png`}
                alt={tSafe("googlePlayAlt", "Get it on Google Play")}
                width={320}
                height={96}
                className="mx-auto h-auto w-[170px] select-none sm:w-[190px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
