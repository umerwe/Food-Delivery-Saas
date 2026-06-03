import { AuthHero } from "@/components/pages/Auth/components/hero"
import { ForgotPassword } from "@/components/forms/ForgotPassword"
import { AUTH_FORM_PANEL_CLASS, AUTH_PAGE_CLASS } from "@/components/common/common-classes"

export const metadata = {
    title: "Forgot Password | Food",
    description: "Reset password to your account",
}

export function ForgotPasswordPage() {
    return (
        <div className={AUTH_PAGE_CLASS}>
            <AuthHero />

            <div className={AUTH_FORM_PANEL_CLASS}>
               <ForgotPassword />
            </div>
        </div>
    )
}
