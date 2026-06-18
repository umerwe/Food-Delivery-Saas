import { z } from "zod";

export type ContactValidationMessages = {
  nameRequired: string;
  emailRequired: string;
  subjectRequired: string;
  messageRequired: string;
};

const defaultMessages: ContactValidationMessages = {
  nameRequired: "Name is required",
  emailRequired: "Valid email is required",
  subjectRequired: "Subject is required",
  messageRequired: "Message is required",
};

export const createContactMessageSchema = (messages: ContactValidationMessages = defaultMessages) =>
  z.object({
    name: z.string().trim().min(1, messages.nameRequired).max(120),
    email: z.string().trim().email(messages.emailRequired).max(254),
    subject: z.string().trim().min(1, messages.subjectRequired).max(160),
    message: z.string().trim().min(1, messages.messageRequired).max(4000),
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
