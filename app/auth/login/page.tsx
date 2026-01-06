import { AuthHero } from "@/components/auth/hero"
import { LoginForm } from "@/components/forms/login"

export const metadata = {
    title: "Login",
    description: "Login to your account",
}

export default function LoginPage() {
    return (
        // h-screen and overflow-hidden prevents the scroller
        <div className="grid h-screen grid-cols-1 lg:grid-cols-2 overflow-hidden">
            {/* Left Side */}
            <AuthHero />
            
            {/* Right Side: Centered Form */}
            <div className="flex items-center justify-center w-full h-full p-4">
                <LoginForm />
            </div>
        </div>
    )
}