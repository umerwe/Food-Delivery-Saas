import { z } from "zod";

export type AuthValidationMessages = {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  restaurantIdRequired: string;
  firstNameRequired: string;
  lastNameRequired: string;
  phoneRequired: string;
  confirmPasswordRequired: string;
  acceptTermsRequired: string;
  passwordsDoNotMatch: string;
  otpRequired: string;
  newPasswordRequired: string;
  restaurantIdMissing: string;
};

export const defaultEnglishValidationMessages: AuthValidationMessages = {
  emailRequired: "Please enter your email",
  emailInvalid: "Please enter a valid email",
  passwordRequired: "Please enter your password",
  restaurantIdRequired: "Please enter restaurant id",
  firstNameRequired: "Please enter first name",
  lastNameRequired: "Please enter last name",
  phoneRequired: "Please enter phone",
  confirmPasswordRequired: "Please confirm your password",
  acceptTermsRequired: "Please accept the terms and privacy policy",
  passwordsDoNotMatch: "Passwords do not match",
  otpRequired: "Please enter the OTP",
  newPasswordRequired: "Please enter a new password",
  restaurantIdMissing: "Invalid or missing restaurantId",
};

const requiredString = (message: string) => z.string().trim().min(1, message);

export const createLoginSchema = (messages: AuthValidationMessages) =>
  z.object({
    email: requiredString(messages.emailRequired).email(messages.emailInvalid),
    password: requiredString(messages.passwordRequired),
    restaurantId: requiredString(messages.restaurantIdRequired),
  });

export const createGuestLoginSchema = (messages: AuthValidationMessages) =>
  z.object({
    firstName: requiredString(messages.firstNameRequired),
    lastName: requiredString(messages.lastNameRequired),
    phone: requiredString(messages.phoneRequired),
    restaurantId: requiredString(messages.restaurantIdRequired),
  });

export const createSignupSchema = (messages: AuthValidationMessages) =>
  z
    .object({
      firstName: requiredString(messages.firstNameRequired),
      lastName: requiredString(messages.lastNameRequired),
      email: requiredString(messages.emailRequired).email(messages.emailInvalid),
      phone: z.string().trim(),
      password: requiredString(messages.passwordRequired),
      confirmPassword: requiredString(messages.confirmPasswordRequired),
      restaurantId: requiredString(messages.restaurantIdRequired),
      tenantId: z.string().trim(),
      acceptTerms: z.boolean().refine((value) => value, {
        message: messages.acceptTermsRequired,
      }),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      message: messages.passwordsDoNotMatch,
    });

export const createForgotPasswordSchema = (messages: AuthValidationMessages) =>
  z.object({
    email: requiredString(messages.emailRequired).email(messages.emailInvalid),
    restaurantId: requiredString(messages.restaurantIdRequired),
  });

export const createResetPasswordSchema = (messages: AuthValidationMessages) =>
  z.object({
    email: requiredString(messages.emailRequired).email(messages.emailInvalid),
    otp: requiredString(messages.otpRequired),
    newPassword: requiredString(messages.newPasswordRequired),
    restaurantId: requiredString(messages.restaurantIdMissing),
  })
;

export const loginSchema = createLoginSchema(defaultEnglishValidationMessages);
export const guestLoginSchema = createGuestLoginSchema(defaultEnglishValidationMessages);
export const signupSchema = createSignupSchema(defaultEnglishValidationMessages);
export const forgotPasswordSchema = createForgotPasswordSchema(defaultEnglishValidationMessages);
export const resetPasswordSchema = createResetPasswordSchema(defaultEnglishValidationMessages);

export type LoginFormValues = z.infer<typeof loginSchema>;
export type GuestLoginFormValues = z.infer<typeof guestLoginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
