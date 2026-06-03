import { describe, expect, it } from "vitest";

import {
  createLoginSchema,
  defaultEnglishValidationMessages,
  forgotPasswordSchema,
  guestLoginSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "./auth";

const validLogin = {
  email: "customer@example.com",
  password: "secret123",
  restaurantId: "restaurant-1",
};

const validGuestLogin = {
  firstName: "Ada",
  lastName: "Lovelace",
  phone: "+923001234567",
  restaurantId: "restaurant-1",
};

const validSignup = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+923001234567",
  password: "secret123",
  confirmPassword: "secret123",
  restaurantId: "restaurant-1",
  tenantId: "tenant-1",
  acceptTerms: true,
};

describe("auth validation schemas", () => {
  it("requires login email, password, and restaurantId", () => {
    const result = loginSchema.safeParse({ email: "", password: "", restaurantId: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["email", "password", "restaurantId"])
    );
  });

  it("rejects invalid login email", () => {
    expect(loginSchema.safeParse({ ...validLogin, email: "not-an-email" }).success).toBe(false);
  });

  it("keeps English defaults while allowing translated schema factories", () => {
    const translatedLoginSchema = createLoginSchema({
      ...defaultEnglishValidationMessages,
      emailRequired: "E-Mail ist erforderlich",
    });

    const defaultResult = loginSchema.safeParse({ ...validLogin, email: "" });
    const translatedResult = translatedLoginSchema.safeParse({ ...validLogin, email: "" });

    expect(defaultResult.error?.issues[0]?.message).toBe("Please enter your email");
    expect(translatedResult.error?.issues[0]?.message).toBe("E-Mail ist erforderlich");
  });

  it("requires guest login names, phone, and restaurantId", () => {
    const result = guestLoginSchema.safeParse({ firstName: "", lastName: "", phone: "", restaurantId: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["firstName", "lastName", "phone", "restaurantId"])
    );
  });

  it("accepts a valid signup payload", () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true);
  });

  it("validates forgot and reset password required fields", () => {
    expect(forgotPasswordSchema.safeParse({ email: "", restaurantId: "" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ email: "", otp: "", newPassword: "", restaurantId: "" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: "ada@example.com", restaurantId: "restaurant-1" }).success).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        email: "ada@example.com",
        otp: "123456",
        newPassword: "secret123",
        restaurantId: "restaurant-1",
      }).success
    ).toBe(true);
  });
});
