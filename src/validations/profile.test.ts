import { describe, expect, it } from "vitest";

import { createProfileSchema, profileSchema } from "./profile";

const validProfile = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+923001234567",
  avatarUrl: "/avatars/ada.png",
  bio: "First programmer",
  gender: "female",
  country: "PK",
  language: "en",
};

describe("profileSchema", () => {
  it("requires first and last name", () => {
    const result = profileSchema.safeParse({ ...validProfile, firstName: "", lastName: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["firstName", "lastName"])
    );
  });

  it("accepts optional phone, bio, and avatar values", () => {
    expect(profileSchema.safeParse({ ...validProfile, phone: "", bio: "", avatarUrl: "" }).success).toBe(true);
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
    expect(profileSchema.safeParse({ ...validProfile, avatarUrl: "https://example.com/avatar.png" }).success).toBe(true);
  });

  it("rejects invalid avatar URLs while allowing relative paths", () => {
    expect(profileSchema.safeParse({ ...validProfile, avatarUrl: "not a url" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...validProfile, avatarUrl: "/uploads/avatar.png" }).success).toBe(true);
  });

  it("uses translated messages from the profile schema factory", () => {
    const schema = createProfileSchema({
      firstNameRequired: "First translated",
      lastNameRequired: "Last translated",
      avatarUrlInvalid: "Avatar translated",
    });

    const result = schema.safeParse({
      ...validProfile,
      firstName: "",
      lastName: "",
      avatarUrl: "not a url",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.firstName).toContain("First translated");
      expect(result.error.flatten().fieldErrors.lastName).toContain("Last translated");
      expect(result.error.flatten().fieldErrors.avatarUrl).toContain("Avatar translated");
    }
  });
});
