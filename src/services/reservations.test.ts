import { describe, expect, it } from "vitest";

import {
  getReservationStatusLabel,
  getReservationStatusLabelKey,
  normalizeReservationResponse,
} from "./reservations";
import type { ApiResult } from "./http";

describe("reservation service helpers", () => {
  it("maps confirmed reservation response status", () => {
    const reservation = normalizeReservationResponse({
      data: {
        id: "reservation-1",
        reservationDate: "2026-06-10T19:30:00.000Z",
        guestCount: 4,
        status: "CONFIRMED",
      },
    } as ApiResult);

    expect(reservation?.status).toBe("CONFIRMED");
    expect(getReservationStatusLabelKey(reservation?.status)).toBe("confirmed");
    expect(getReservationStatusLabel(reservation?.status)).toBe("Confirmed");
  });

  it("maps requested reservation response status", () => {
    const reservation = normalizeReservationResponse({
      data: {
        data: {
          id: "reservation-2",
          reservationDate: "2026-06-10T19:30:00.000Z",
          guestCount: 4,
          status: "REQUESTED",
        },
      },
    } as ApiResult);

    expect(reservation?.status).toBe("REQUESTED");
    expect(getReservationStatusLabelKey(reservation?.status)).toBe("requested");
    expect(getReservationStatusLabel(reservation?.status)).toBe("Requested");
  });
});
