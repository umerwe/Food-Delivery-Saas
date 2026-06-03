"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/components/providers/auth-provider";
import { BrandingProvider } from "@/components/providers/branding-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import QueryProvider from "@/components/providers/query-provider";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <I18nProvider>
        <AuthProvider>
          <BrandingProvider>{children}</BrandingProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
