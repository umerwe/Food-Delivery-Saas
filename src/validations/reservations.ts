import { z } from "zod";

const todayDateValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const reservationSchema = z.object({
  branchId: z.string().trim().min(1, "Please select a branch"),
  date: z
    .string()
    .trim()
    .min(1, "Select date & time")
    .refine((value) => value >= todayDateValue(), {
      message: "Past dates are not available for reservation.",
    }),
  time: z.string().trim().min(1, "Select date & time"),
  guestCount: z
    .number()
    .int("Guest count must be a whole number")
    .min(1, "Guest count must be at least 1")
    .max(20, "Guest count must be 20 or fewer"),
  note: z.string().max(500, "Special request must be 500 characters or fewer").optional(),
});

export type ReservationFormValues = z.infer<typeof reservationSchema>;
