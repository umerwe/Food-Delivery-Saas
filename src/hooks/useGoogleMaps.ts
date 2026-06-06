"use client";

import { useEffect, useState } from "react";

import type { GoogleMapsApi } from "@/types/google-maps";

type GoogleMapsStatus = "idle" | "loading" | "ready" | "missing-key" | "error";

const GOOGLE_MAPS_SCRIPT_ID = "deliveryway-google-maps";
const GOOGLE_MAPS_LIBRARIES = "places";

let googleMapsPromise: Promise<GoogleMapsApi> | null = null;

const getGoogleMapsApi = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.google?.maps?.places ? window.google : null;
};

const loadGoogleMaps = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  const loadedGoogle = getGoogleMapsApi();

  if (loadedGoogle) {
    return Promise.resolve(loadedGoogle);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is not configured."));
  }

  googleMapsPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        const api = getGoogleMapsApi();
        api ? resolve(api) : reject(new Error("Google Maps did not initialize."));
      });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load.")));
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=${GOOGLE_MAPS_LIBRARIES}`;
    script.addEventListener("load", () => {
      const api = getGoogleMapsApi();
      api ? resolve(api) : reject(new Error("Google Maps did not initialize."));
    });
    script.addEventListener("error", () => reject(new Error("Google Maps failed to load.")));

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const useGoogleMaps = () => {
  const [status, setStatus] = useState<GoogleMapsStatus>("idle");
  const [googleMaps, setGoogleMaps] = useState<GoogleMapsApi | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    if (typeof window === "undefined") {
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

    if (!apiKey) {
      setStatus("missing-key");
      setErrorMessage("Google Maps is not configured yet.");
      return;
    }

    setStatus("loading");

    loadGoogleMaps()
      .then((api) => {
        if (!active) return;
        setGoogleMaps(api);
        setStatus("ready");
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setGoogleMaps(null);
        setStatus(error instanceof Error && error.message.includes("key") ? "missing-key" : "error");
        setErrorMessage(error instanceof Error ? error.message : "Google Maps failed to load.");
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    googleMaps,
    status,
    errorMessage,
    isReady: status === "ready" && Boolean(googleMaps),
  };
};
