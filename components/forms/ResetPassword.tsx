"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/constants";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Input } from "../ui/input";

const ResetPassword = () => {
  const params = useParams();
  const router = useRouter();
const searchParams = useSearchParams();
  const token = params?.token as string;

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
useEffect(() => {
  const emailFromUrl = searchParams.get("email");
  const restaurantIdFromUrl = searchParams.get("restaurantId");

  if (emailFromUrl) {
    setEmail(emailFromUrl);
  }

  if (restaurantIdFromUrl) {
    setRestaurantId(restaurantIdFromUrl);
  }
}, [searchParams]);
  const handleResetPassword = async (e: React.FormEvent) => {
     e.preventDefault()
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }
    if (!restaurantId) {
      toast.error("Invalid or missing restauranrId");
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
          token,
          newPassword,
          restaurantId
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Password reset failed");
      }

      toast.success("Password reset successfully!");

      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
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
                <h1 className="text-headline-sm font-bold font-roboto text-primary">Reset password</h1>
                <p className="text-sm text-muted-foreground">Please, fill in details to reset password</p>
            </div>

            {/* Form */}
            <form onSubmit={handleResetPassword} className="space-y-[16px] mt-[35px] mb-[19px]">
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
<div className="relative">
                    <Input
                        id="newPassword"
                        name="newPassword"
                        type="text"
              placeholder="Enter new password"
              value={newPassword}
           
              onChange={(e)=>setNewPassword(e.target.value)}
                     
                        required
                    />
                </div>
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

            
           
        </div>
    )
};

export default ResetPassword;