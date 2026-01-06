import { AuthHero } from "@/components/auth/hero"
import { SignUpForm } from "@/components/forms/signup"

export const metadata = {
    title: "Sign Up",
    description: "Create your account",
}

export default function SignUpPage() {
    return (
        // h-screen and overflow-hidden prevents the scroller
        <div className="grid h-screen grid-cols-1 lg:grid-cols-2 overflow-hidden">
            {/* Left Side */}
            <AuthHero />
            
            {/* Right Side: Centered Form */}
            <div className="flex items-center justify-center w-full h-full p-4">
                <SignUpForm />
            </div>
        </div>
    )
}