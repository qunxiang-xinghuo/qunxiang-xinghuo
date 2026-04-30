import { z } from "zod";

export const matchRequestSchema = z.object({
  brainholeId: z.string().cuid(),
  identity: z.string().min(1, '身份标签不能为空').max(100, '身份标签不能超过100字'),
  preferDifferent: z.boolean().default(true),
  timeoutMinutes: z.coerce.number().int().min(1).max(60).default(10),
  mode: z.enum(["duo", "multi", "ai"]).default("duo"),
});

export const matchCancelSchema = z.object({
  matchId: z.string().cuid(),
});

export const matchStatusSchema = z.object({
  matchId: z.string().cuid(),
});

export const matchCriteriaSchema = z.object({
  brainholeId: z.string().cuid(),
  identity: z.string().min(1, '身份标签不能为空').max(100, '身份标签不能超过100字'),
  excludeUserId: z.string().cuid().optional(),
  minLevel: z.number().int().min(1).default(1),
  maxLevel: z.number().int().min(1).default(10),
  preferDifferentIdentity: z.boolean().default(true),
  timeoutMinutes: z.number().int().min(1).max(60).default(10),
  mode: z.enum(["duo", "multi", "ai"]).default("duo"),
});

export type MatchRequestInput = z.infer<typeof matchRequestSchema>;
export type MatchCancelInput = z.infer<typeof matchCancelSchema>;
export type MatchStatusInput = z.infer<typeof matchStatusSchema>;
export type MatchCriteriaInput = z.infer<typeof matchCriteriaSchema>;
