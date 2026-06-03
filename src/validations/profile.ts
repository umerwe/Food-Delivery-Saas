import { z } from "zod";

export type ProfileValidationMessages = {
  firstNameRequired: string;
  lastNameRequired: string;
  avatarUrlInvalid: string;
};

export const defaultEnglishProfileValidationMessages: ProfileValidationMessages = {
  firstNameRequired: "First name is required",
  lastNameRequired: "Last name is required",
  avatarUrlInvalid: "Avatar must be a valid URL or relative path",
};

const createOptionalAvatarUrl = (message: string) => z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    if (value.startsWith("/")) return true;

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, message);

export const createProfileSchema = (messages: ProfileValidationMessages) => z.object({
  firstName: z.string().trim().min(1, messages.firstNameRequired),
  lastName: z.string().trim().min(1, messages.lastNameRequired),
  email: z.string().trim(),
  phone: z.string().trim(),
  avatarUrl: createOptionalAvatarUrl(messages.avatarUrlInvalid),
  bio: z.string().trim(),
  gender: z.string().trim(),
  country: z.string().trim(),
  language: z.string().trim(),
});

export const profileSchema = createProfileSchema(defaultEnglishProfileValidationMessages);

export type ProfileFormValues = z.infer<typeof profileSchema>;
