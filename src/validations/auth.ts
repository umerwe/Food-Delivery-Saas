import { z } from "zod";

const requiredString = (message: string) => z.string().trim().min(1, message);

export const loginSchema = z.object({
  email: requiredString("Please enter your email").email("Please enter a valid email"),
  password: requiredString("Please enter your password"),
  restaurantId: requiredString("Please enter restaurant id"),
});

export const guestLoginSchema = z.object({
  firstName: requiredString("Please enter first name"),
  lastName: requiredString("Please enter last name"),
  phone: requiredString("Please enter phone"),
  restaurantId: requiredString("Please enter restaurant id"),
});

export const signupSchema = z
  .object({
    firstName: requiredString("Please enter first name"),
    lastName: requiredString("Please enter last name"),
    email: requiredString("Please enter your email").email("Please enter a valid email"),
    phone: z.string().trim(),
    password: requiredString("Please enter your password"),
    confirmPassword: requiredString("Please confirm your password"),
    restaurantId: requiredString("Please enter restaurant id"),
    tenantId: z.string().trim(),
    acceptTerms: z.boolean().refine((value) => value, {
      message: "Please accept the terms and privacy policy",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const forgotPasswordSchema = z.object({
  email: requiredString("Please enter your email").email("Please enter a valid email"),
  restaurantId: requiredString("Please enter restaurant id"),
});

export const resetPasswordSchema = z.object({
  email: requiredString("Please enter your email").email("Please enter a valid email"),
  otp: requiredString("Please enter the OTP"),
  newPassword: requiredString("Please enter a new password"),
  restaurantId: requiredString("Invalid or missing restaurantId"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type GuestLoginFormValues = z.infer<typeof guestLoginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
