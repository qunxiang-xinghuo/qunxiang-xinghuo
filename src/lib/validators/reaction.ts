import { z } from "zod";

export const reactionCreateSchema = z.object({
  content: z.string().min(1, "反应内容不能为空").max(5000, "反应内容不能超过5000字"),
  identity: z.string().min(1, "身份标签不能为空").max(100, "身份标签不能超过100字"),
  emotionTag: z.string().optional(),
  mediaUrl: z.string().url("媒体URL格式不正确").optional(),
  mediaDuration: z.number().positive("媒体时长必须为正数").optional(),
  brainholeId: z.string().cuid("无效的脑洞ID"),
  roomId: z.string().cuid("无效的房间ID").optional(),
});

export const reactionUpdateSchema = z.object({
  content: z.string().min(1, "反应内容不能为空").max(5000, "反应内容不能超过5000字").optional(),
  emotionTag: z.string().optional(),
  isSpark: z.boolean().optional(),
  sparkMarkedBy: z.string().cuid("无效的用户ID").optional(),
});

export const reactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  brainholeId: z.string().cuid("无效的脑洞ID").optional(),
  roomId: z.string().cuid("无效的房间ID").optional(),
  userId: z.string().cuid("无效的用户ID").optional(),
  identity: z.string().optional(),
  isSpark: z.boolean().optional(),
  sortBy: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const reactionMarkSparkSchema = z.object({
  reactionId: z.string().cuid("无效的反应ID"),
  isSpark: z.boolean(),
});

export type ReactionCreateInput = z.infer<typeof reactionCreateSchema>;
export type ReactionUpdateInput = z.infer<typeof reactionUpdateSchema>;
export type ReactionQueryInput = z.infer<typeof reactionQuerySchema>;
export type ReactionMarkSparkInput = z.infer<typeof reactionMarkSparkSchema>;