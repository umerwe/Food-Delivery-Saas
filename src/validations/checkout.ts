import { z } from "zod";

export type CheckoutValidationMessages = {
  emailInvalid: string;
  streetRequired: string;
  cityRequired: string;
  countryRequired: string;
};

export const defaultEnglishCheckoutValidationMessages: CheckoutValidationMessages = {
  emailInvalid: "Please enter a valid email",
  streetRequired: "Street address is required",
  cityRequired: "City is required",
  countryRequired: "Country is required",
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

export const createCheckoutAddressSchema = (
  messages: Pick<
    CheckoutValidationMessages,
    "streetRequired" | "cityRequired" | "countryRequired"
  >
) => z.object({
  street: z.string().trim().min(1, messages.streetRequired),
  city: z.string().trim().min(1, messages.cityRequired),
  state: z.string().trim(),
  country: z.string().trim().min(1, messages.countryRequired),
  area: z.string().trim(),
  lat: z.string().trim(),
  lng: z.string().trim(),
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
