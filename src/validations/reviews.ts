import { z } from "zod";

export type ReviewValidationMessages = {
  reviewMax: string;
};

const defaultMessages: ReviewValidationMessages = {
  reviewMax: "Review must be 1000 characters or fewer",
};

export const createReviewSchema = (messages: ReviewValidationMessages = defaultMessages) =>
  z.object({
    rating: z.number().int().min(1).max(5),
    review: z.string().max(1000, messages.reviewMax).optional(),
  });

export const reviewSchema = createReviewSchema();

export type ReviewFormValues = z.infer<typeof reviewSchema>;
