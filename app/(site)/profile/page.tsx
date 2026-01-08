import ProfileTabs from "@/components/profile/Tabs";
import ProfileForm from "@/components/forms/ProfileForm";
import PaymentMethodView from "@/components/profile/PaymentMethodSection";
import PaymentForm from "@/components/forms/PaymentForm";

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const params = await searchParams;
    const activeTab = params.tab || "profile";

    return (
        <main className="max-w-[1400px] mx-auto px-4 pt-[11px] pb-[100px]">
            <h1 className="text-[32px] font-semibold text-center mb-[38px] text-[#000000]">
                My Account
            </h1>

            {/* URL-driven Tab Switcher */}
            <ProfileTabs activeTab={activeTab} />

            {/* SSR Content Sections */}
            <div className="mt-[56px]">
                {activeTab === "profile" && <ProfileForm />}
                {activeTab === "payment-method" && <PaymentMethodView />}
                {
                    activeTab === "history" &&
                    <div className="max-w-[675px] mx-auto">
                        <PaymentForm type="history" />
                    </div>}
            </div>
        </main>
    );
}