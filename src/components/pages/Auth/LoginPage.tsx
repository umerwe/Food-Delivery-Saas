import { AuthHero } from "@/components/pages/Auth/components/hero"
import LoginForm from "@/components/forms/LoginForm"
import { AUTH_FORM_PANEL_CLASS, AUTH_PAGE_CLASS } from "@/components/common/common-classes"

export const metadata = {
    title: "Login | Food",
    description: "Login to your account",
}

export function LoginPage() {
    return (
        <div className={AUTH_PAGE_CLASS}>
            <AuthHero />

            <div className={AUTH_FORM_PANEL_CLASS}>
                <LoginForm />
            </div>
        </div>
    )
}
