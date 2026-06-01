"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { getAuthErrorMessage } from "@/lib/auth";
import { resendResetOtp, resetPassword } from "@/services/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { MUTED_TEXT_CLASS } from "@/components/common/common-classes";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/validations/auth";

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
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
      toast.error("Missing email or restaurant id");
      return;
    }

    try {
      setIsResending(true);

      await resendResetOtp({
        email,
        restaurantId,
      });

      toast.success("OTP resent successfully");

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

      toast.success("Password reset successfully!");

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
          Reset password
        </h1>
        <p className={MUTED_TEXT_CLASS}>
          Enter the OTP sent to your email and set a new password
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
          placeholder="Email"
          required
          {...form.register("email")}
        />

        {/* OTP */}
        <Input
          id="otp"
          type="text"
          placeholder="Enter OTP"
          required
          {...form.register("otp")}
        />

        {/* RESEND OTP */}
        <div className="flex justify-between items-center text-sm">

          {countdown > 0 ? (
            <span className="text-muted-foreground">
              Resend OTP in {countdown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="text-primary hover:underline"
            >
              {isResending ? "Sending..." : "Resend OTP"}
            </button>
          )}

        </div>

        {/* New Password */}
        <Input
          id="newPassword"
          type="password"
          placeholder="Enter new password"
          required
          {...form.register("newPassword")}
        />

        {/* Restaurant ID */}
        <Input
          id="restaurantId"
          type="text"
          placeholder="Restaurant ID"
          required
          {...form.register("restaurantId")}
        />


        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[50px] text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-base transition-colors mb-[15px]"
        >
          {isLoading ? "Submitting..." : "Reset Password"}
        </Button>

      </form>

    </div>
  );
};

export default ResetPassword;
