"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSafeRedirectPath } from "@/lib/auth-routes";
import { getAuthErrorMessage } from "@/lib/auth";
import { forgotPassword } from "@/services/auth";
import { MUTED_TEXT_CLASS } from "@/components/common/common-classes";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/validations/auth";

const ForgotPassword = () => {
  const router = useRouter();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      restaurantId: "",
    },
  });
const [isLoading, setIsLoading] = useState(false);
const [resetUrl, setResetUrl] = useState("");
//  Forgot Password Function
const handleForgotPassword = async (values: ForgotPasswordFormValues) => {
  try {
    setIsLoading(true);

    await forgotPassword({ email: values.email , restaurantId: values.restaurantId});

// const resetToken = data?.data?.resetToken;

// if (resetToken) {
//   const generatedUrl = `${window.location.origin}/auth/reset-password/${resetToken}?email=${encodeURIComponent(email)}&restaurantId=${restaurantId}`;

//   setResetUrl(generatedUrl);

//   toast.success("Reset link generated (Dev Mode)");
// } else {
//   toast.success("If account exists, reset instructions are sent");
// }


toast.success("If the account exists, you can now reset your password");

router.push(getSafeRedirectPath(`/auth/reset-password?email=${encodeURIComponent(
  values.email
)}&restaurantId=${values.restaurantId}`));

  } catch (error) {
    toast.error(getAuthErrorMessage(error));
  } finally {
    setIsLoading(false);
  }
};
   return (
        <div className="w-full lg:mr-[79px]">

            <div className="space-y-1">
                <h1 className="text-headline-sm font-bold font-roboto text-primary">Forgot password?</h1>
                <p className={MUTED_TEXT_CLASS}>Please, fill in email to reset password</p>
            </div>


            <form onSubmit={form.handleSubmit(handleForgotPassword)} className="space-y-[16px] mt-[35px] mb-[19px]" noValidate>
                {/* Email */}
                <div className="relative">
                    <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        required
                        {...form.register("email")}
                    />
                </div>

                {/* Password */}
                <div className="relative">
                    <Input
                        id="restaurantId"
                        type="text"
                        placeholder="restaurantId"
                        required
                        {...form.register("restaurantId")}
                    />
                </div>


                {/* Login Button */}
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-[50px] text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-base transition-colors mb-[15px]"
                >
                    {isLoading ? "Submitting..." : "Submit"}
                </Button>
            </form>
{resetUrl && (
  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <p className="text-xs text-yellow-700 font-medium mb-2">
      Dev Mode: Reset link generated (email service not configured)
    </p>

    <a
      href={resetUrl}
      className="text-sm text-blue-600 break-all hover:underline"
    >
      {resetUrl}
    </a>
  </div>
)}



        </div>
    )
};

export default ForgotPassword;
