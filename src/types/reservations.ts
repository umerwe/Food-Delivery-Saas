import type { BranchRecord } from "@/types/branch-selector";

export type ReservationStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "SEATED"
  | "COMPLETED"
  | "CANCELLED"
  | "PENDING"
  | "NO_SHOW";

export type ReservationStatusLabelKey =
  | "requested"
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "noShow"
  | "unknown";

export type ReservationBranch = BranchRecord & {
  coverImage?: string | null;
  description?: string | null;
};

export type Reservation = {
  id: string;
  branchId?: string | null;
  branch?: ReservationBranch | null;
  reservationDate: string;
  guestCount: number;
  note?: string | null;
  status: ReservationStatus;
};

export type ReservationPayload = {
  branchId: string;
  reservationDate: string;
  guestCount: number;
  note?: string;
};

export type ReservationMeta = {
  page?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

export const getReservationStatusLabelKey = (
  status?: string | null
): ReservationStatusLabelKey => {
  switch (String(status || "").toUpperCase()) {
    case "REQUESTED":
      return "requested";
    case "PENDING":
      return "pending";
    case "CONFIRMED":
      return "confirmed";
    case "SEATED":
      return "seated";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    case "NO_SHOW":
      return "noShow";
    default:
      return "unknown";
  }
};

export const getReservationStatusLabel = (status?: string | null) => {
  switch (getReservationStatusLabelKey(status)) {
    case "requested":
      return "Requested";
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "seated":
      return "Seated";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "noShow":
      return "No-show";
    default:
      return "Unknown";
  }
};
