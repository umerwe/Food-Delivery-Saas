import { Suspense } from "react";
import { AuthHero } from "@/components/pages/Auth/components/hero";
import ResetPassword from "@/components/forms/ResetPassword";
import { AUTH_FORM_PANEL_CLASS, AUTH_PAGE_CLASS } from "@/components/common/common-classes"

export const metadata = {
  title: "Reset Password | Food",
  description: "Reset your password securely",
};

export function ResetPasswordPage() {
  return (
    <div className={AUTH_PAGE_CLASS}>
      <AuthHero />

      <div className={AUTH_FORM_PANEL_CLASS}>
        <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
          <ResetPassword />
        </Suspense>
      </div>
    </div>
  );
}
