"use client";

import { useEffect, useState } from "react";

import { readStoredDomainContext, writeStoredDomainContext, type DomainContext } from "@/lib/domain-context";
import { resolveDomainContext } from "@/services/domain-context";

type DomainContextState = {
  context: DomainContext | null;
  loading: boolean;
  error: Error | null;
};

export const useDomainContext = (): DomainContextState => {
  const [state, setState] = useState<DomainContextState>(() => ({
    context: readStoredDomainContext(),
    loading: typeof window !== "undefined",
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;
    const host = window.location.host;

    resolveDomainContext(host)
      .then((context) => {
        if (cancelled) return;
        writeStoredDomainContext(context);
        setState({ context, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const nextError = error instanceof Error ? error : new Error("Failed to resolve restaurant domain");
        setState((previous) => ({ ...previous, loading: false, error: nextError }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
