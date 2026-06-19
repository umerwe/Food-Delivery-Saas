export type GoogleLatLngLiteral = {
  lat: number;
  lng: number;
};

export type GoogleAddressDetails = {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
};

export type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GooglePlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

export type GooglePlaceDetails = {
  formatted_address?: string;
  address_components?: GoogleAddressComponent[];
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
};

export type GoogleGeocoderResult = {
  formatted_address?: string;
  address_components?: GoogleAddressComponent[];
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
};

type GoogleAutocompleteService = {
  getPlacePredictions: (
    request: {
      input: string;
      types?: string[];
      componentRestrictions?: {
        country: string | string[];
      };
    },
    callback: (predictions: GooglePlacePrediction[] | null, status: string) => void
  ) => void;
};

type GooglePlacesService = {
  getDetails: (
    request: {
      placeId: string;
      fields: string[];
    },
    callback: (place: GooglePlaceDetails | null, status: string) => void
  ) => void;
};

type GoogleGeocoder = {
  geocode: (
    request: {
      location?: GoogleLatLngLiteral;
      address?: string;
    },
    callback: (results: GoogleGeocoderResult[] | null, status: string) => void
  ) => void;
};

export type GoogleMapInstance = {
  setCenter: (position: GoogleLatLngLiteral) => void;
  setZoom: (zoom: number) => void;
};

export type GoogleMarkerInstance = {
  setPosition: (position: GoogleLatLngLiteral) => void;
  getPosition: () =>
    | {
        lat: () => number;
        lng: () => number;
      }
    | null;
};

type GoogleMapClickEvent = {
  latLng?: {
    lat: () => number;
    lng: () => number;
  };
};

export type GoogleMapsApi = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: {
        center: GoogleLatLngLiteral;
        zoom: number;
        disableDefaultUI?: boolean;
        zoomControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
        mapTypeControl?: boolean;
      }
    ) => GoogleMapInstance;
    Marker: new (
      options: {
        map: GoogleMapInstance;
        position: GoogleLatLngLiteral;
        draggable?: boolean;
      }
    ) => GoogleMarkerInstance;
    Geocoder: new () => GoogleGeocoder;
    event: {
      addListener: (
        instance: GoogleMapInstance | GoogleMarkerInstance,
        eventName: "click" | "dragend",
        handler: (event: GoogleMapClickEvent) => void
      ) => void;
      clearInstanceListeners: (instance: GoogleMapInstance | GoogleMarkerInstance) => void;
    };
    places: {
      AutocompleteService: new () => GoogleAutocompleteService;
      PlacesService: new (element: HTMLElement) => GooglePlacesService;
      PlacesServiceStatus: {
        OK: string;
        ZERO_RESULTS: string;
      };
    };
    GeocoderStatus: {
      OK: string;
      ZERO_RESULTS: string;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}
