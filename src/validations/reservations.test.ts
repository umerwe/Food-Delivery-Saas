import { describe, expect, it } from "vitest";

import { createReservationSchema, reservationSchema } from "./reservations";

const getDateValue = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const validReservation = {
  branchId: "branch-1",
  date: getDateValue(1),
  time: "18:30",
  guestCount: 2,
  note: "Window seat",
};

describe("reservationSchema", () => {
  it("rejects past reservation dates", () => {
    const result = reservationSchema.safeParse({
      ...validReservation,
      date: getDateValue(-1),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Past dates are not available for reservation.");
  });

  it("validates guest count range", () => {
    expect(reservationSchema.safeParse({ ...validReservation, guestCount: 0 }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...validReservation, guestCount: 21 }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...validReservation, guestCount: 5 }).success).toBe(true);
  });

  it("requires date, time, guest count, and contact branch fields", () => {
    const result = reservationSchema.safeParse({
      ...validReservation,
      branchId: "",
      date: "",
      time: "",
      guestCount: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["branchId", "date", "time", "guestCount"])
    );
  });

  it("accepts optional fields", () => {
    expect(reservationSchema.safeParse({ ...validReservation, note: undefined }).success).toBe(true);
  });

  it("supports translated validation messages from the schema factory", () => {
    const translatedSchema = createReservationSchema({
      branchRequired: "Filiale erforderlich",
      dateTimeRequired: "Datum und Uhrzeit erforderlich",
      pastDate: "Vergangenes Datum",
      guestWholeNumber: "Ganze Zahl erforderlich",
      guestMin: "Mindestens ein Gast",
      guestMax: "Zu viele Gäste",
      noteMax: "Notiz zu lang",
    });

    const result = translatedSchema.safeParse({
      ...validReservation,
      branchId: "",
      date: getDateValue(-1),
      guestCount: 21,
      note: "x".repeat(501),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Filiale erforderlich",
        "Vergangenes Datum",
        "Zu viele Gäste",
        "Notiz zu lang",
      ])
    );
  });
});
