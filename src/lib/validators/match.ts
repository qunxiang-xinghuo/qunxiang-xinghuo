import { z } from "zod";

export const matchRequestSchema = z.object({
  brainholeId: z.string().cuid("无效的脑洞ID"),
  identity: z.string().min(1, "身份标签不能为空").max(100, "身份标签不能超过100字"),
  preferDifferent: z.boolean().default(true),
  timeoutMinutes: z.coerce.number().int().min(1).max(60).default(10),
});

export const matchCancelSchema = z.object({
  matchId: z.string().cuid("无效的匹配ID"),
});

export const matchStatusSchema = z.object({
  matchId: z.string().cuid("无效的匹配ID"),
});

export const matchCriteriaSchema = z.object({
  brainholeId: z.string().cuid("无效的脑洞ID"),
  identity: z.string().min(1, "身份标签不能为空").max(100, "身份标签不能超过100字"),
  excludeUserId: z.string().cuid("无效的用户ID").optional(),
  minLevel: z.number().int().min(1).default(1),
  maxLevel: z.number().int().min(1).default(10),
  preferDifferentIdentity: z.boolean().default(true),
  timeoutMinutes: z.number().int().min(1).max(60).default(10),
});

export type MatchRequestInput = z.infer<typeof matchRequestSchema>;
export type MatchCancelInput = z.infer<typeof matchCancelSchema>;
export type MatchStatusInput = z.infer<typeof matchStatusSchema>;
export type MatchCriteriaInput = z.infer<typeof matchCriteriaSchema>;