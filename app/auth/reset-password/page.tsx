import { AuthHero } from "@/components/auth/hero"
import ResetPassword from "@/components/forms/ResetPassword"

export const metadata = {
    title: "Reset Password | Food",
    description: "Reset your password securely",
}

export default function SignUpPage() {
    return (
        <div className="flex flex-col flex-1 lg:flex-row gap-[70px] xl:gap-[130px] min-h-screen">
            <AuthHero />

            <div className="flex items-center justify-center lg:justify-normal w-full flex-1 px-4 md:px-32 lg:px-0 py-[85px]">
                <ResetPassword />
            </div>
        </div>
    )
}
