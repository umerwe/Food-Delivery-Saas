"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthContext } from "@/components/providers/auth-provider";

export { useAuthContext } from "@/components/providers/auth-provider";

export const useAuth = () => {
  const auth = useAuthContext();
  const { user, token, loading } = auth;
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push("/auth/login");
    }
  }, [isPublicRoute, loading, router, user]);

  return {
    ...auth,
    user,
    token,
    restaurantId: user?.restaurantId,
    loading,
  };
};
