import { AuthHero } from "@/components/pages/Auth/components/hero"
import { SignUpForm } from "@/components/forms/SignupForm"
import { AUTH_FORM_PANEL_CLASS, AUTH_PAGE_CLASS } from "@/components/common/common-classes"

export const metadata = {
    title: "Sign Up | Food",
    description: "Create your account",
}

export function SignupPage() {
    return (
        <div className={AUTH_PAGE_CLASS}>
            <AuthHero />

            <div className={AUTH_FORM_PANEL_CLASS}>
                <SignUpForm />
            </div>
        </div>
    )
}
