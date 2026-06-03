import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

const NewsletterSection = () => {
    const t = useTranslations("home.newsletter");

    return (
        <section
            className="relative w-full h-[481px] py-20 md:py-28 bg-cover bg-center bg-no-repeat"
            // The background image is set here. Make sure 'newletter-bg.png' is in your public folder.
            style={{ backgroundImage: "url('/newsletter-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
        >
            {/* Dark overlay to ensure text is readable */}
            <div className="absolute inset-0 bg-black/60 z-0"></div>

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">

                {/* Headline */}
                <h2 className="text-[46px] font-semibold mb-4 leading-[tighter]">
                    {t("titleLineOne")}
                    <span className="hidden md:block">{t("titleLineTwo")}</span>
                </h2>


                {/* Sub-headline */}
                <p className="text-base  leading-[28px] text-white/90 mb-[32px]">
                    {t("description")}
                </p>


                <form className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-[708px] mx-auto">
                    <input
                        type="email"
                        placeholder={t("placeholder")}
                        className="w-full bg-white rounded-full py-4 px-6 outline-none placeholder:text-gray-400 text-gray-800 focus:ring-2 focus:ring-[#F15A2B] transition-all"
                        required
                    />
                    <Button
                        variant="primary"
                        type="submit"
                    >
                        {t("subscribe")}
                    </Button>
                </form>

            </div>
        </section>
    );
};

export default NewsletterSection;
