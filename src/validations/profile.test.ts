import { describe, expect, it } from "vitest";

import { profileSchema } from "./profile";

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
});
