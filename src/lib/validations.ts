import { z } from "zod";

const tweetUrlRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/i;

export const testimonialSchema = z.object({
  tweetUrl: z.string().min(1, "Tweet URL is required").refine((v) => tweetUrlRegex.test(v), "Invalid Twitter/X URL"),
  authorName: z.string().min(1, "Author name is required"),
  handle: z.string().min(1, "Handle is required").refine((v) => v.startsWith("@"), "Handle must start with @"),
  tweetText: z.string().min(1, "Tweet text is required"),
  displayText: z.string().optional(),
  date: z.string().min(1, "Date is required").refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "Use YYYY-MM-DD"),
  columnIndex: z.number().min(0).max(4),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export type TestimonialFormValues = z.infer<typeof testimonialSchema>;
