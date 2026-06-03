import { z } from "zod";

export type ContactValidationMessages = {
  nameRequired: string;
  emailRequired: string;
  messageRequired: string;
};

const defaultMessages: ContactValidationMessages = {
  nameRequired: "Name is required",
  emailRequired: "Valid email is required",
  messageRequired: "Message is required",
};

export const createContactMessageSchema = (messages: ContactValidationMessages = defaultMessages) =>
  z.object({
    name: z.string().trim().min(1, messages.nameRequired),
    email: z.string().trim().email(messages.emailRequired),
    message: z.string().trim().min(1, messages.messageRequired),
  });

export const createNewsletterSchema = (
  messages: Pick<ContactValidationMessages, "emailRequired"> = defaultMessages
) =>
  z.object({
    email: z.string().trim().email(messages.emailRequired),
  });

export const contactMessageSchema = createContactMessageSchema();

export const newsletterSchema = createNewsletterSchema();

export type ContactMessageFormValues = z.infer<typeof contactMessageSchema>;
export type NewsletterFormValues = z.infer<typeof newsletterSchema>;
