import { z } from "zod";

const optionalAvatarUrl = z
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
  }, "Avatar must be a valid URL or relative path");

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim(),
  phone: z.string().trim(),
  avatarUrl: optionalAvatarUrl,
  bio: z.string().trim(),
  gender: z.string().trim(),
  country: z.string().trim(),
  language: z.string().trim(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
