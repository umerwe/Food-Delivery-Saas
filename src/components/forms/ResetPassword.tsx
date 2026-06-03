"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getAuthErrorMessage } from "@/lib/auth";
import { resendResetOtp, resetPassword } from "@/services/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { MUTED_TEXT_CLASS } from "@/components/common/common-classes";
import {
  createResetPasswordSchema,
  type AuthValidationMessages,
  type ResetPasswordFormValues,
} from "@/validations/auth";

export function ResetPasswordLoadingFallback() {
  const tCommon = useTranslations("common");

  return <div className="text-sm text-gray-500">{tCommon("loading")}</div>;
}

const useAuthValidationMessages = (): AuthValidationMessages => {
  const t = useTranslations("validation");

  return useMemo(
    () => ({
      emailRequired: t("emailRequired"),
      emailInvalid: t("emailInvalid"),
      passwordRequired: t("passwordRequired"),
      restaurantIdRequired: t("restaurantIdRequired"),
      firstNameRequired: t("firstNameRequired"),
      lastNameRequired: t("lastNameRequired"),
      phoneRequired: t("phoneRequired"),
      confirmPasswordRequired: t("confirmPasswordRequired"),
      acceptTermsRequired: t("acceptTermsRequired"),
      passwordsDoNotMatch: t("passwordsDoNotMatch"),
      otpRequired: t("otpRequired"),
      newPasswordRequired: t("newPasswordRequired"),
      restaurantIdMissing: t("restaurantIdMissing"),
    }),
    [t]
  );
};

function ResetPasswordFormInner() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const validationMessages = useAuthValidationMessages();
  const translatedResetPasswordSchema = useMemo(
    () => createResetPasswordSchema(validationMessages),
    [validationMessages]
  );

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(translatedResetPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      restaurantId: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  /* ================= GET DATA FROM URL ================= */

  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    const restaurantIdFromUrl = searchParams.get("restaurantId");

    if (emailFromUrl) form.setValue("email", emailFromUrl);
    if (restaurantIdFromUrl) form.setValue("restaurantId", restaurantIdFromUrl);
  }, [form, searchParams]);

  /* ================= COUNTDOWN TIMER ================= */

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  /* ================= RESEND OTP ================= */

  const handleResendOtp = async () => {
    const email = form.getValues("email");
    const restaurantId = form.getValues("restaurantId");

    if (!email || !restaurantId) {
      toast.error(t("missingEmailOrRestaurantId"));
      return;
    }

    try {
      setIsResending(true);

      await resendResetOtp({
        email,
        restaurantId,
      });

      toast.success(t("otpResent"));

      setCountdown(60);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  /* ================= RESET PASSWORD ================= */

  const handleResetPassword = async (values: ResetPasswordFormValues) => {
    try {
      setIsLoading(true);

      await resetPassword({
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword,
        restaurantId: values.restaurantId,
      });

      toast.success(t("passwordResetSuccess"));

      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:mr-[79px]">


      <div className="space-y-1">
        <h1 className="text-headline-sm font-bold font-roboto text-primary">
          {t("resetPasswordTitle")}
        </h1>
        <p className={MUTED_TEXT_CLASS}>
          {t("resetPasswordDescription")}
        </p>
      </div>


      <form
        onSubmit={form.handleSubmit(handleResetPassword)}
        className="space-y-[16px] mt-[35px] mb-[19px]"
        noValidate
      >

        {/* Email */}
        <Input
          id="email"
          type="email"
          placeholder={t("email")}
          required
          {...form.register("email")}
        />

        {/* OTP */}
        <Input
          id="otp"
          type="text"
          placeholder={t("enterOtp")}
          required
          {...form.register("otp")}
        />

        {/* RESEND OTP */}
        <div className="flex justify-between items-center text-sm">

          {countdown > 0 ? (
            <span className="text-muted-foreground">
              {t("resendOtpIn", { count: countdown })}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="text-primary hover:underline"
            >
              {isResending ? t("sending") : t("resendOtp")}
            </button>
          )}

        </div>

        {/* New Password */}
        <Input
          id="newPassword"
          type="password"
          placeholder={t("enterNewPassword")}
          required
          {...form.register("newPassword")}
        />

        {/* Restaurant ID */}
        <Input
          id="restaurantId"
          type="text"
          placeholder={t("restaurantIdUpper")}
          required
          {...form.register("restaurantId")}
        />


        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[50px] text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-base transition-colors mb-[15px]"
        >
          {isLoading ? tCommon("submitting") : t("resetPassword")}
        </Button>

      </form>

    </div>
  );
}

export function ResetPassword() {
  return (
    <Suspense fallback={<ResetPasswordLoadingFallback />}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
