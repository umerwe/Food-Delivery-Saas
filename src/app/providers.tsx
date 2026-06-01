"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/components/providers/auth-provider";
import { BrandingProvider } from "@/components/providers/branding-provider";
import QueryProvider from "@/components/providers/query-provider";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrandingProvider>{children}</BrandingProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
