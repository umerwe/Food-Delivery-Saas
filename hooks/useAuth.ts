"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export const useAuth = () => {
  const { user, token, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push("/auth/login");
    }
  }, [loading, user, pathname]);

  return {
    user,
    token,
    restaurantId: user?.restaurantId,
    loading,
  };
};