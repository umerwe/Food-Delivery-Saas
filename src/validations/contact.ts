import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  message: z.string().trim().min(1, "Message is required"),
});

export const newsletterSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
});

export type ContactMessageFormValues = z.infer<typeof contactMessageSchema>;
export type NewsletterFormValues = z.infer<typeof newsletterSchema>;
