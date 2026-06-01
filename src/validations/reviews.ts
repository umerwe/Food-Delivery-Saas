import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000, "Review must be 1000 characters or fewer").optional(),
  image: z.instanceof(File).optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
