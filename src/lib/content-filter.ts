/**
 * 内容安全过滤工具
 * 敏感词过滤 + 内容长度限制
 */

// 基础敏感词列表（示例）
const BASIC_SENSITIVE_WORDS = [
  // 政治敏感
  '暴力', '恐怖', '分裂', '颠覆',
  // 色情低俗
  '色情', '淫秽', '裸露', '性爱',
  // 辱骂攻击
  '傻逼', '操你', '他妈', '滚蛋',
  // 其他
  '赌博', '毒品', '诈骗'
];

// 敏感词替换字符
const REPLACE_CHAR = '*';

/**
 * 检查文本是否包含敏感词
 * @param text - 待检查文本
 * @param customWords - 自定义敏感词列表
 * @returns 检查结果
 */
export function checkSensitiveWords(
  text: string,
  customWords: string[] = []
): {
  hasSensitive: boolean;
  matchedWords: string[];
  filteredText: string;
} {
  const allWords = [...BASIC_SENSITIVE_WORDS, ...customWords];
  const matchedWords: string[] = [];
  let filteredText = text;

  for (const word of allWords) {
    if (text.includes(word)) {
      matchedWords.push(word);
      // 替换敏感词
      const regex = new RegExp(word, 'g');
      filteredText = filteredText.replace(regex, REPLACE_CHAR.repeat(word.length));
    }
  }

  return {
    hasSensitive: matchedWords.length > 0,
    matchedWords,
    filteredText
  };
}

/**
 * 验证内容长度
 * @param text - 待验证文本
 * @param maxLength - 最大长度
 * @returns 验证结果
 */
export function validateLength(
  text: string,
  maxLength: number
): {
  valid: boolean;
  length: number;
  maxLength: number;
  message?: string;
} {
  const length = text.length;

  if (length > maxLength) {
    return {
      valid: false,
      length,
      maxLength,
      message: `内容超出${maxLength}字限制（当前${length}字）`
    };
  }

  return {
    valid: true,
    length,
    maxLength
  };
}

/**
 * 完整的内容安全检查
 * @param text - 待检查文本
 * @param maxLength - 最大长度
 * @param customWords - 自定义敏感词
 * @returns 检查结果
 */
export function contentSafetyCheck(
  text: string,
  maxLength: number,
  customWords: string[] = []
): {
  passed: boolean;
  errors: string[];
  filteredText: string;
} {
  const errors: string[] = [];

  // 1. 长度检查
  const lengthCheck = validateLength(text, maxLength);
  if (!lengthCheck.valid) {
    errors.push(lengthCheck.message || '内容长度超限');
  }

  // 2. 敏感词检查
  const sensitiveCheck = checkSensitiveWords(text, customWords);
  if (sensitiveCheck.hasSensitive) {
    errors.push(`包含敏感词：${sensitiveCheck.matchedWords.join('、')}`);
  }

  return {
    passed: errors.length === 0,
    errors,
    filteredText: sensitiveCheck.filteredText
  };
}

/**
 * 清理 HTML 标签（防止 XSS）
 * @param text - 待清理文本
 * @returns 清理后的文本
 */
export function sanitizeHTML(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
