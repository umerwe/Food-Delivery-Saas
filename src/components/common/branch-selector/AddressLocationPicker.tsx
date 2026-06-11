"use client";

import { Loader2, MapPin, MousePointer2, Navigation, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import type {
  GoogleLatLngLiteral,
  GoogleMapInstance,
  GoogleMarkerInstance,
  GooglePlacePrediction,
} from "@/types/google-maps";

type AddressLocationPickerProps = {
  coordinates: GoogleLatLngLiteral | null;
  locationLabel?: string;
  onSelectLocation: (coordinates: GoogleLatLngLiteral, label?: string) => void;
  onUseCurrentLocation: () => void;
  isLocating?: boolean;
  compact?: boolean;
  showSelectedLabel?: boolean;
};

const DEFAULT_MAP_CENTER: GoogleLatLngLiteral = {
  lat: 20,
  lng: 0,
};

const MIN_QUERY_LENGTH = 3;

export function AddressLocationPicker({
  coordinates,
  locationLabel,
  onSelectLocation,
  onUseCurrentLocation,
  isLocating = false,
  compact = false,
  showSelectedLabel = true,
}: AddressLocationPickerProps) {
  const { googleMaps, status, errorMessage, isReady } = useGoogleMaps();
  const [query, setQuery] = useState(locationLabel ?? "");
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPredictionPanelOpen, setIsPredictionPanelOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleMarkerInstance | null>(null);

  const trimmedQuery = query.trim();
  const selectedLabel = locationLabel || (coordinates ? "Selected map location" : "");
  const center = useMemo(() => coordinates ?? DEFAULT_MAP_CENTER, [coordinates]);

  useEffect(() => {
    setQuery(locationLabel ?? "");
  }, [locationLabel]);

  useEffect(() => {
    if (!isPredictionPanelOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (pickerRef.current?.contains(target)) return;

      setIsPredictionPanelOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPredictionPanelOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPredictionPanelOpen]);

  useEffect(() => {
    if (!isReady || !googleMaps || trimmedQuery.length < MIN_QUERY_LENGTH) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setIsSearching(true);

      const service = new googleMaps.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: trimmedQuery,
          types: ["geocode"],
          componentRestrictions: {
            country: "pk",
          },
        },
        (results, serviceStatus) => {
          if (!active) return;

          setIsSearching(false);
          setPredictions(
            serviceStatus === googleMaps.maps.places.PlacesServiceStatus.OK && results
              ? results.slice(0, 5)
              : []
          );
          setIsPredictionPanelOpen(true);
        }
      );
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [googleMaps, isReady, trimmedQuery]);

  const reverseGeocode = useCallback(
    (nextCoordinates: GoogleLatLngLiteral) => {
      if (!googleMaps) {
        onSelectLocation(nextCoordinates, "Selected map location");
        return;
      }

      const geocoder = new googleMaps.maps.Geocoder();

      geocoder.geocode({ location: nextCoordinates }, (results, geocoderStatus) => {
        const label =
          geocoderStatus === googleMaps.maps.GeocoderStatus.OK && results?.[0]?.formatted_address
            ? results[0].formatted_address
            : "Selected map location";

        onSelectLocation(nextCoordinates, label);
      });
    },
    [googleMaps, onSelectLocation]
  );

  const syncMarker = useCallback(
    (nextCoordinates: GoogleLatLngLiteral) => {
      if (!googleMaps || !mapRef.current) return;

      if (!markerRef.current) {
        markerRef.current = new googleMaps.maps.Marker({
          map: mapRef.current,
          position: nextCoordinates,
          draggable: true,
        });

        googleMaps.maps.event.addListener(markerRef.current, "dragend", () => {
          const markerPosition = markerRef.current?.getPosition();

          if (!markerPosition) return;

          reverseGeocode({
            lat: markerPosition.lat(),
            lng: markerPosition.lng(),
          });
        });
      } else {
        markerRef.current.setPosition(nextCoordinates);
      }
    },
    [googleMaps, reverseGeocode]
  );

  useEffect(() => {
    if (!mapOpen || !isReady || !googleMaps || !mapElementRef.current) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = new googleMaps.maps.Map(mapElementRef.current, {
        center,
        zoom: coordinates ? 15 : 2,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
      });

      googleMaps.maps.event.addListener(mapRef.current, "click", (event) => {
        if (!event.latLng) return;

        const nextCoordinates = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };

        syncMarker(nextCoordinates);
        reverseGeocode(nextCoordinates);
      });
    }

    mapRef.current.setCenter(center);
    mapRef.current.setZoom(coordinates ? 15 : 2);

    if (coordinates) {
      syncMarker(coordinates);
    }
  }, [center, coordinates, googleMaps, isReady, mapOpen, reverseGeocode, syncMarker]);

  const handlePredictionSelect = (prediction: GooglePlacePrediction) => {
    if (!googleMaps) return;

    setPredictions([]);
    setIsPredictionPanelOpen(false);
    setQuery(prediction.description);

    const placesService = new googleMaps.maps.places.PlacesService(document.createElement("div"));
    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["formatted_address", "geometry"],
      },
      (place, placeStatus) => {
        const location = place?.geometry?.location;

        if (placeStatus !== googleMaps.maps.places.PlacesServiceStatus.OK || !location) {
          return;
        }

        const nextCoordinates = {
          lat: location.lat(),
          lng: location.lng(),
        };

        onSelectLocation(nextCoordinates, place.formatted_address ?? prediction.description);
        setMapOpen(true);
      }
    );
  };

  const unavailableCopy =
    status === "missing-key"
      ? "Address search is not configured yet. You can still use current location."
      : errorMessage;

  return (
    <div ref={pickerRef} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsPredictionPanelOpen(true);
            }}
            onFocus={() => {
              if (predictions.length > 0 || isSearching) {
                setIsPredictionPanelOpen(true);
              }
            }}
            placeholder="Search your address"
            className="h-[49px] w-full rounded-xl border border-transparent bg-[#F5F5F5] pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            disabled={status === "missing-key" || status === "error"}
          />

          {isPredictionPanelOpen && (isSearching || predictions.length > 0) && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-[min(260px,42vh)] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
              {isSearching ? (
                <div className="flex items-center gap-2 px-4 py-4 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching addresses...
                </div>
              ) : (
                predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    type="button"
                    onClick={() => handlePredictionSelect(prediction)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-orange-50/60"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#111827]">
                        {prediction.structured_formatting?.main_text ?? prediction.description}
                      </span>
                      <span className="mt-1 block truncate text-xs text-[#6B7280]">
                        {prediction.structured_formatting?.secondary_text ?? prediction.description}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex h-[49px] items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white px-4 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          Current location
        </button>

        <button
          type="button"
          onClick={() => setMapOpen((current) => !current)}
          disabled={status === "missing-key" || status === "error"}
          className="inline-flex h-[49px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-[#d94e24] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <MousePointer2 className="h-4 w-4" />
          {mapOpen ? "Hide map" : "Pick on map"}
        </button>
      </div>

      {showSelectedLabel && selectedLabel ? (
        <p className="flex min-w-0 items-start gap-2 text-xs leading-5 text-[#6B7280]">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="min-w-0 break-words">{selectedLabel}</span>
        </p>
      ) : null}

      {unavailableCopy && status !== "ready" && status !== "loading" ? (
        <p className="rounded-xl bg-[#F9FAFB] px-4 py-3 text-xs leading-5 text-[#6B7280]">
          {unavailableCopy}
        </p>
      ) : null}

      {mapOpen ? (
        <div className={`overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] ${compact ? "h-[220px]" : "h-[280px]"}`}>
          {isReady ? (
            <div ref={mapElementRef} className="h-full w-full" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-[#6B7280]">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading Google map...
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
