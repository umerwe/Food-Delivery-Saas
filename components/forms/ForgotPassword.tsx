"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { Input } from "@/components/ui/input";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [resetUrl, setResetUrl] = useState("");
// ✅ Forgot Password Function
const handleForgotPassword = async (e: React.FormEvent) => {
     e.preventDefault()
  if (!email) {
    toast.error("Please enter your email");
    return;
  }

  try {
    setIsLoading(true);

    const res = await fetch(
      `${API_BASE_URL}/v1/auth/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email , restaurantId}),
      }
    );
const data = await res.json();

if (!res.ok) {
  throw new Error(data?.message || "Failed to send reset link");
}

// const resetToken = data?.data?.resetToken;

// if (resetToken) {
//   const generatedUrl = `${window.location.origin}/auth/reset-password/${resetToken}?email=${encodeURIComponent(email)}&restaurantId=${restaurantId}`;

//   setResetUrl(generatedUrl);

//   toast.success("Reset link generated (Dev Mode)");
// } else {
//   toast.success("If account exists, reset instructions are sent");
// }


toast.success("If the account exists, you can now reset your password");

window.location.href = `/auth/reset-password?email=${encodeURIComponent(
  email
)}&restaurantId=${restaurantId}`;

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
                <h1 className="text-headline-sm font-bold font-roboto text-primary">Forgot password?</h1>
                <p className="text-sm text-muted-foreground">Please, fill in email to reset password</p>
            </div>

            {/* Form */}
            <form onSubmit={handleForgotPassword} className="space-y-[16px] mt-[35px] mb-[19px]">
                {/* Email */}
                <div className="relative">
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                        required
                    />
                </div>

                {/* Password */}
                <div className="relative">
                    <Input
                        id="restaurantId"
                        name="restaurantId"
                        type="text"
                        placeholder="restaurantId"
                        value={restaurantId}
                           onChange={(e)=>setRestaurantId(e.target.value)}
                     
                        required
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
