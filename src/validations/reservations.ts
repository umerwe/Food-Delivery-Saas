import { z } from "zod";

export type ReservationValidationMessages = {
  branchRequired: string;
  dateTimeRequired: string;
  pastDate: string;
  guestWholeNumber: string;
  guestMin: string;
  guestMax: string;
  noteMax: string;
};

export const defaultEnglishReservationValidationMessages: ReservationValidationMessages = {
  branchRequired: "Please select a branch",
  dateTimeRequired: "Select date & time",
  pastDate: "Past dates are not available for reservation.",
  guestWholeNumber: "Guest count must be a whole number",
  guestMin: "Guest count must be at least 1",
  guestMax: "Guest count must be 20 or fewer",
  noteMax: "Special request must be 500 characters or fewer",
};

const todayDateValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const createReservationSchema = (messages: ReservationValidationMessages) => z.object({
  branchId: z.string().trim().min(1, messages.branchRequired),
  date: z
    .string()
    .trim()
    .min(1, messages.dateTimeRequired)
    .refine((value) => value >= todayDateValue(), {
      message: messages.pastDate,
    }),
  time: z.string().trim().min(1, messages.dateTimeRequired),
  guestCount: z
    .number()
    .int(messages.guestWholeNumber)
    .min(1, messages.guestMin)
    .max(20, messages.guestMax),
  note: z.string().max(500, messages.noteMax).optional(),
});

export const reservationSchema = createReservationSchema(defaultEnglishReservationValidationMessages);

export type ReservationFormValues = z.infer<typeof reservationSchema>;
