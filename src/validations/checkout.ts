import { z } from "zod";

export const checkoutCustomerSchema = z.object({
  name: z.string().trim(),
  phone: z.string().trim(),
  email: z.string().trim().email().or(z.literal("")),
});

export const checkoutNotesSchema = z.object({
  note: z.string(),
});

export const checkoutAddressSchema = z.object({
  street: z.string().trim().min(1, "Street address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim(),
  country: z.string().trim().min(1, "Country is required"),
  area: z.string().trim(),
  lat: z.string().trim(),
  lng: z.string().trim(),
});

export type CheckoutCustomerValues = z.infer<typeof checkoutCustomerSchema>;
export type CheckoutNotesValues = z.infer<typeof checkoutNotesSchema>;
export type CheckoutAddressValues = z.infer<typeof checkoutAddressSchema>;
