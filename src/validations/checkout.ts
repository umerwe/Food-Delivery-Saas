import { z } from "zod";

export type CheckoutValidationMessages = {
  emailInvalid: string;
  streetRequired: string;
  postalCodeRequired: string;
  cityRequired: string;
  stateRequired: string;
  countryRequired: string;
  latitudeRequired: string;
  longitudeRequired: string;
};

export const defaultEnglishCheckoutValidationMessages: CheckoutValidationMessages = {
  emailInvalid: "Please enter a valid email",
  streetRequired: "Street address is required",
  postalCodeRequired: "Postal code is required",
  cityRequired: "City is required",
  stateRequired: "State is required",
  countryRequired: "Country is required",
  latitudeRequired: "Pick a location before saving",
  longitudeRequired: "Pick a location before saving",
};

export const createCheckoutCustomerSchema = (
  messages: Pick<CheckoutValidationMessages, "emailInvalid">
) => z.object({
  name: z.string().trim(),
  phone: z.string().trim(),
  email: z.string().trim().email(messages.emailInvalid).or(z.literal("")),
});

export const createCheckoutNotesSchema = () => z.object({
  note: z.string(),
});

export const checkoutTipSchema = z.object({
  tipAmount: z
    .number()
    .min(0, "Tip amount must be 0 or greater")
    .optional(),
});

export const createCheckoutAddressSchema = (
  messages: Pick<
    CheckoutValidationMessages,
    "streetRequired" | "postalCodeRequired" | "cityRequired" | "countryRequired"
    | "stateRequired" | "latitudeRequired" | "longitudeRequired"
  >
) => z.object({
  street: z.string().trim().min(1, messages.streetRequired),
  houseNumber: z.string().trim(),
  postalCode: z.string().trim().min(1, messages.postalCodeRequired),
  city: z.string().trim().min(1, messages.cityRequired),
  state: z.string().trim().min(1, messages.stateRequired),
  country: z.string().trim().min(1, messages.countryRequired),
  area: z.string().trim(),
  lat: z.string().trim().min(1, messages.latitudeRequired),
  lng: z.string().trim().min(1, messages.longitudeRequired),
  isDefault: z.boolean(),
});

export const checkoutCustomerSchema = createCheckoutCustomerSchema(
  defaultEnglishCheckoutValidationMessages
);
export const checkoutNotesSchema = createCheckoutNotesSchema();
export const checkoutAddressSchema = createCheckoutAddressSchema(
  defaultEnglishCheckoutValidationMessages
);

export type CheckoutCustomerValues = z.infer<typeof checkoutCustomerSchema>;
export type CheckoutNotesValues = z.infer<typeof checkoutNotesSchema>;
export type CheckoutAddressValues = z.infer<typeof checkoutAddressSchema>;
export type CheckoutTipValues = z.infer<typeof checkoutTipSchema>;

export const normalizeCheckoutTipAmount = (value: unknown) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
