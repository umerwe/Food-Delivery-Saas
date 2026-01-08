import { AuthHero } from "@/components/auth/hero"
import LoginForm from "@/components/forms/LoginForm"

export const metadata = {
    title: "Login | Food",
    description: "Login to your account",
}

export default function LoginPage() {
    return (
        <div className="flex flex-col flex-1 lg:flex-row gap-[70px] xl:gap-[130px] min-h-screen">
            <AuthHero />

            <div className="flex items-center justify-center lg:justify-normal w-full flex-1 px-4 md:px-32 lg:px-0 py-[85px]">
                <LoginForm />
            </div>
        </div>
    )
}