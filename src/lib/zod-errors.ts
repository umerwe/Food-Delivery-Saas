import type { ZodError } from "zod";

export const getZodErrorMessage = (error: ZodError, fallback = "Invalid input") =>
  error.issues[0]?.message ?? fallback;

export const getZodFieldErrors = (error: ZodError) =>
  error.issues.reduce<Record<string, string>>((errors, issue) => {
    const key = issue.path.join(".");

    if (key && !errors[key]) {
      errors[key] = issue.message;
    }

    return errors;
  }, {});
