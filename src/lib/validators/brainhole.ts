import { z } from "zod";

export const brainholeCreateSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题不能超过200字"),
  scenario: z.string().min(1, "情境描述不能为空").max(5000, "情境描述不能超过5000字"),
  contextTime: z.string().optional(),
  contextLocation: z.string().optional(),
  contextCharacters: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  tags: z.array(z.string()).optional().default([]),
});

export const brainholeUpdateSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题不能超过200字").optional(),
  scenario: z.string().min(1, "情境描述不能为空").max(5000, "情境描述不能超过5000字").optional(),
  contextTime: z.string().optional(),
  contextLocation: z.string().optional(),
  contextCharacters: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  status: z.enum(["pending", "approved", "rejected", "archived"]).optional(),
});

export const brainholeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  status: z.enum(["pending", "approved", "rejected", "archived"]).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "reactionCount", "sparkCount", "collectionCount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const brainholeCollectSchema = z.object({
  brainholeId: z.string().cuid("无效的脑洞ID"),
});

export type BrainholeCreateInput = z.infer<typeof brainholeCreateSchema>;
export type BrainholeUpdateInput = z.infer<typeof brainholeUpdateSchema>;
export type BrainholeQueryInput = z.infer<typeof brainholeQuerySchema>;
export type BrainholeCollectInput = z.infer<typeof brainholeCollectSchema>;