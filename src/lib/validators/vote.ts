import { z } from "zod";

export const voteCreateSchema = z.object({
  roomId: z.string().cuid("无效的房间ID"),
  question: z.string().min(1, "投票问题不能为空").max(500, "投票问题不能超过500字"),
  options: z.array(
    z.object({
      text: z.string().min(1, "选项文本不能为空").max(200, "选项文本不能超过200字"),
    })
  ).min(2, "至少需要2个选项").max(6, "最多6个选项"),
});

export const voteCastSchema = z.object({
  voteId: z.string().cuid("无效的投票ID"),
  optionIdx: z.number().int().min(0, "无效的选项索引"),
});

export const voteResolveSchema = z.object({
  voteId: z.string().cuid("无效的投票ID"),
  winnerOptionIdx: z.number().int().min(0, "无效的获胜选项索引").optional(),
  forceClose: z.boolean().default(false),
});

export const voteQuerySchema = z.object({
  roomId: z.string().cuid("无效的房间ID").optional(),
  status: z.enum(["open", "closed", "cancelled"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type VoteCreateInput = z.infer<typeof voteCreateSchema>;
export type VoteCastInput = z.infer<typeof voteCastSchema>;
export type VoteResolveInput = z.infer<typeof voteResolveSchema>;
export type VoteQueryInput = z.infer<typeof voteQuerySchema>;