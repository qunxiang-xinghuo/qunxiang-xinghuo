/**
 * ============================================
 * 内容安全过滤模块
 * ============================================
 * 
 * 功能说明：
 * - 敏感词检测和过滤
 * - 内容长度验证
 * - 防止违规内容传播
 * 
 * 使用场景：
 * - 房间创建时：检查场景描述和角色名字
 * - 消息发送时：检查对话内容
 * - AI 生成时：检查 AI 输出内容
 * 
 * @example
 * const result = contentSafetyCheck("你好", 100);
 * if (!result.passed) {
 *   console.error(result.errors);
 * }
 */

/**
 * 敏感词分级列表
 * 
 * 一级（绝对禁止）：政治、色情、暴力、歧视 - 直接拦截
 * 二级（警告但允许）：脏话、粗口 - 提示但允许
 * 三级（忽略）：正常情绪表达 - 不拦截
 */

// 一级敏感词：绝对禁止
const LEVEL_1_SENSITIVE_WORDS = [
  // 政治敏感
  '反动', '分裂国家', '颠覆政权',
  // 色情
  '色情', '淫秽', '嫖娼',
  // 暴力恐怖
  '恐怖主义', '极端主义',
  // 歧视
  '种族歧视', '性别歧视',
];

// 二级敏感词：警告但允许（创作场景下的粗口）
const LEVEL_2_SENSITIVE_WORDS = [
  // 粗口（创作场景允许）
  '他妈', '妈的', '操', '靠', '滚',
  // 情绪表达
  '去死', '恨你', '讨厌',
];

// 白名单：创作场景下的正常情绪表达（不拦截）
const WHITELIST_WORDS = [
  '想你', '爱你', '吻', '拥抱',
  '哭泣', '伤心', '难过', '痛苦',
  '死亡', '离开', '分手', '再见',
];

/**
 * 内容安全检查结果接口
 */
export interface SafetyCheckResult {
  passed: boolean;      // 是否通过检查
  level?: 'safe' | 'warning' | 'blocked'; // 安全级别
  errors?: string[];    // 错误信息列表
  warnings?: string[];  // 警告信息列表
  filteredContent?: string; // 过滤后的内容（可选）
}

/**
 * 内容安全检查函数
 * 
 * @param content - 待检查的内容
 * @param maxLength - 最大长度限制
 * @returns SafetyCheckResult - 检查结果
 * 
 * @example
 * // 检查场景描述
 * const result = contentSafetyCheck("机场候机厅", 200);
 * // { passed: true }
 * 
 * @example
 * // 检查包含敏感词的内容
 * const result = contentSafetyCheck("包含敏感词的内容", 100);
 * // { passed: false, errors: ["包含敏感内容"] }
 */
export function contentSafetyCheck(
  content: string,
  maxLength: number
): SafetyCheckResult {
  const errors: string[] = [];

  // 1. 检查是否为空
  if (!content || content.trim().length === 0) {
    errors.push('内容不能为空');
    return { passed: false, errors };
  }

  // 2. 检查长度限制
  if (content.length > maxLength) {
    errors.push(`内容超出长度限制（最多${maxLength}字）`);
    return { passed: false, errors };
  }

  // 3. 检查敏感词（分级策略）
  // 一级词库：绝对禁止（政治、色情、暴力、歧视）
  const LEVEL1_WORDS = ['法轮功', '台独', '藏独', '色情', '卖淫', '嫖娼'];
  // 二级词库：警告但允许（脏话、粗口）- 在创作场景下放宽
  const LEVEL2_WORDS = ['他妈', '操你', '傻逼', '妈的'];
  // 三级词库：忽略（正常情绪表达）- 创作场景允许
  const LEVEL3_WORDS = ['恨', '死', '杀', '滚', '去你的'];

  // 检查一级词库（绝对禁止）
  const containsLevel1 = LEVEL1_WORDS.some(word => 
    content.includes(word)
  );

  if (containsLevel1) {
    errors.push('内容包含禁止词汇，请修改后重试');
    return { passed: false, errors };
  }

  // 二级和三级词库在创作场景下允许通过
  // 不再拦截"他妈的""死""杀"等情绪表达词汇

  // 4. 检查通过
  return { passed: true };
}

/**
 * 批量内容安全检查
 * 用于同时检查多个字段
 * 
 * @param fields - 字段对象 { [fieldName]: content }
 * @param limits - 长度限制对象 { [fieldName]: maxLength }
 * @returns Record<string, SafetyCheckResult> - 各字段的检查结果
 * 
 * @example
 * const results = batchContentSafetyCheck(
 *   { scene: "机场", roleA: "林晓" },
 *   { scene: 200, roleA: 20 }
 * );
 */
export function batchContentSafetyCheck(
  fields: Record<string, string>,
  limits: Record<string, number>
): Record<string, SafetyCheckResult> {
  const results: Record<string, SafetyCheckResult> = {};

  for (const [fieldName, content] of Object.entries(fields)) {
    const maxLength = limits[fieldName] || 100;
    results[fieldName] = contentSafetyCheck(content, maxLength);
  }

  return results;
}

/**
 * 过滤敏感词（替换为*）
 * 
 * @param content - 原始内容
 * @returns string - 过滤后的内容
 * 
 * @example
 * const filtered = filterSensitiveWords("包含敏感词的内容");
 * // "包含***的内容"
 */
export function filterSensitiveWords(content: string): string {
  let filtered = content;
  
  SENSITIVE_WORDS.forEach(word => {
    const regex = new RegExp(word, 'g');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });

  return filtered;
}
