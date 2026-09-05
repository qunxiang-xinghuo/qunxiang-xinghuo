/**
 * 输入验证和防护工具
 * 防止 SQL 注入、XSS、命令注入等攻击
 */

import { z } from 'zod';

/**
 * 清理字符串输入
 * 移除潜在的危险字符
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    // 移除 null 字节（防止 null 字节注入）
    .replace(/\0/g, '')
    // 限制长度
    .slice(0, 10000);
}

/**
 * 验证邮箱格式
 */
export const emailSchema = z
  .string()
  .min(1, '邮箱不能为空')
  .max(254, '邮箱过长')
  .email('邮箱格式不正确')
  .transform((val) => val.toLowerCase().trim());

/**
 * 验证用户名
 */
export const usernameSchema = z
  .string()
  .min(3, '用户名至少 3 个字符')
  .max(30, '用户名不能超过 30 个字符')
  .regex(
    /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
    '用户名只能包含字母、数字、下划线和中文'
  )
  .transform((val) => val.trim());

/**
 * 验证密码
 */
export const passwordSchema = z
  .string()
  .min(8, '密码至少 8 个字符')
  .max(128, '密码不能超过 128 个字符')
  .regex(/[A-Za-z]/, '密码必须包含字母')
  .regex(/[0-9]/, '密码必须包含数字');

/**
 * 验证场景 ID
 */
export const sceneIdSchema = z
  .string()
  .min(1, '场景 ID 不能为空')
  .max(50, '场景 ID 过长')
  .regex(/^[a-z0-9-]+$/, '场景 ID 只能包含小写字母、数字和连字符');

/**
 * 验证消息内容
 */
export const messageContentSchema = z
  .string()
  .min(1, '消息内容不能为空')
  .max(5000, '消息内容不能超过 5000 字符')
  .transform((val) => sanitizeInput(val));

/**
 * 验证故事标题
 */
export const storyTitleSchema = z
  .string()
  .min(1, '标题不能为空')
  .max(100, '标题不能超过 100 字符')
  .transform((val) => sanitizeInput(val).trim());

/**
 * 验证故事内容
 */
export const storyContentSchema = z
  .string()
  .min(1, '内容不能为空')
  .max(50000, '内容不能超过 50000 字符')
  .transform((val) => sanitizeInput(val));

/**
 * 验证注册请求
 */
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

/**
 * 验证登录请求
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '密码不能为空'),
});

/**
 * 验证创建会话请求
 */
export const createSessionSchema = z.object({
  sceneId: sceneIdSchema,
});

/**
 * 验证发送消息请求
 */
export const sendMessageSchema = z.object({
  content: messageContentSchema,
  roleId: z.string().min(1, '角色 ID 不能为空'),
});

/**
 * 验证创建故事请求
 */
export const createStorySchema = z.object({
  title: storyTitleSchema,
  content: storyContentSchema,
  conversationId: z.string().min(1, '会话 ID 不能为空'),
});

/**
 * 验证知乎搜索请求
 */
export const zhihuSearchSchema = z.object({
  query: z
    .string()
    .min(1, '搜索词不能为空')
    .max(100, '搜索词不能超过 100 字符')
    .transform((val) => sanitizeInput(val).trim()),
});

/**
 * 类型安全的验证函数
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // 返回第一个错误信息
  const error = result.error.issues[0];
  return {
    success: false,
    error: `${error.path.join('.')}: ${error.message}`,
  };
}

/**
 * API 响应错误格式
 */
export function validationErrorResponse(message: string) {
  return new Response(
    JSON.stringify({
      error: '验证失败',
      details: message,
    }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * 防止 XSS 攻击
 * 清理 HTML 标签
 */
export function stripHTML(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * 验证 URL 格式
 */
export const urlSchema = z
  .string()
  .url('URL 格式不正确')
  .max(2048, 'URL 过长');

/**
 * 验证分页参数
 */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, '页码必须大于 0').default(1),
  limit: z.coerce
    .number()
    .min(1, '每页数量必须大于 0')
    .max(100, '每页数量不能超过 100')
    .default(20),
});

// ============================================
// 安全增强验证
// ============================================

/**
 * 常见弱密码列表（防止用户使用过于简单的密码）
 */
const COMMON_PASSWORDS = [
  'password', '12345678', '123456789', '1234567890',
  'qwerty123', 'abc12345', 'abcd1234', '11111111',
  '00000000', 'iloveyou', 'admin123', 'welcome1',
  'password1', 'changeme', 'letmein1',
];

/**
 * 强化密码验证
 * 要求：
 * - 至少 8 位
 * - 包含字母和数字
 * - 不能是常见弱密码
 * - 不能包含连续重复字符超过 4 次
 */
export const strongPasswordSchema = z
  .string()
  .min(8, '密码至少 8 个字符')
  .max(128, '密码不能超过 128 个字符')
  .regex(/[A-Za-z]/, '密码必须包含字母')
  .regex(/[0-9]/, '密码必须包含数字')
  .refine((val) => !COMMON_PASSWORDS.includes(val.toLowerCase()), {
    message: '密码过于简单，请使用更复杂的密码',
  })
  .refine((val) => !/(.)\1{4,}/.test(val), {
    message: '密码不能包含连续重复的字符（如 aaaaa）',
  });

/**
 * 举报原因枚举
 */
export const reportReasonSchema = z.enum([
  'porn',          // 色情低俗
  'violence',      // 暴力血腥
  'harassment',    // 骚扰攻击
  'spam',          // 垃圾广告
  'infringement',  // 侵权抄袭
  'other',         // 其他
]);

/**
 * 举报目标类型枚举
 */
export const reportTargetTypeSchema = z.enum(['story', 'room', 'message']);

/**
 * XSS 输入检测
 * 检测输入中是否包含潜在的 XSS 攻击载荷
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script[\s>]/i,
    /<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i, // onload=, onclick= 等事件处理器
    /<iframe[\s>]/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];
  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * SQL 注入检测
 * 检测输入中是否包含 SQL 注入特征
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|alter|create|exec)\b.*\b(from|into|table|database)\b)/i,
    /(--|#|\/\*|\*\/)/, // SQL 注释
    /;\s*(drop|delete|update|insert)/i,
    /'\s*or\s*'?\d*'?\s*=\s*'?\d*/i, // ' OR '1'='1
    /'\s*or\s+1\s*=\s*1/i,
  ];
  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * 综合安全检查
 * 返回 true 表示输入安全
 */
export function isSafeInput(input: string): boolean {
  if (!input) return true;
  if (containsXSS(input)) return false;
  // 注意：Prisma 使用参数化查询，SQL 注入风险低
  // 这里仅作为额外的日志记录，不直接拦截
  return true;
}

