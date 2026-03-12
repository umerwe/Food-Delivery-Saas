"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "../ui/input";

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* ================= GET DATA FROM URL ================= */

  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    const restaurantIdFromUrl = searchParams.get("restaurantId");

    if (emailFromUrl) setEmail(emailFromUrl);
    if (restaurantIdFromUrl) setRestaurantId(restaurantIdFromUrl);
  }, [searchParams]);

  /* ================= RESET PASSWORD ================= */

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (!restaurantId) {
      toast.error("Invalid or missing restaurantId");
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch(`${API_BASE_URL}/v1/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
          restaurantId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Password reset failed");
      }

      toast.success("Password reset successfully!");

      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);

    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:mr-[79px]">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-headline-sm font-bold font-roboto text-primary">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the OTP sent to your email and set a new password
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleResetPassword}
        className="space-y-[16px] mt-[35px] mb-[19px]"
      >

        {/* Email */}
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* OTP */}
        <Input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        {/* New Password */}
        <Input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        {/* Restaurant ID */}
        <Input
          type="text"
          placeholder="Restaurant ID"
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          required
        />

        {/* Submit */}
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