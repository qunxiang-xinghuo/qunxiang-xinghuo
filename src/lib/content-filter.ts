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
 * 敏感词列表（示例）
 * 实际项目中应该从数据库或配置文件加载
 * 这里只包含少量示例词
 */
const SENSITIVE_WORDS = [
  // 政治敏感
  '敏感词 1',
  '敏感词 2',
  // 暴力
  '暴力词 1',
  // 色情
  '色情词 1',
  // 其他
  '广告',
  '推广',
];

/**
 * 内容安全检查结果接口
 */
export interface SafetyCheckResult {
  passed: boolean;      // 是否通过检查
  errors?: string[];    // 错误信息列表
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

  // 3. 检查敏感词
  const containsSensitive = SENSITIVE_WORDS.some(word => 
    content.includes(word)
  );

  if (containsSensitive) {
    errors.push('内容包含敏感词汇，请修改后重试');
    return { passed: false, errors };
  }

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
