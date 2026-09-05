/**
 * 请求签名工具
 * 用于防止重放攻击和请求篡改
 */

import crypto from 'crypto';

const SECRET_KEY = process.env.REQUEST_SIGN_SECRET || 'default-secret-change-in-production';

/**
 * 生成请求签名
 * @param payload 请求数据
 * @param timestamp 时间戳
 * @returns 签名字符串
 */
export function generateSignature(payload: unknown, timestamp: number): string {
  const data = JSON.stringify(payload) + timestamp;
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('hex');
}

/**
 * 验证请求签名
 * @param payload 请求数据
 * @param timestamp 时间戳
 * @param signature 签名字符串
 * @returns 是否有效
 */
export function verifySignature(
  payload: unknown,
  timestamp: number,
  signature: string
): boolean {
  // 1. 基础校验：签名/时间戳必须是非空字符串/数字
  if (!signature || typeof signature !== 'string' || !Number.isFinite(timestamp)) {
    return false;
  }

  // 2. 检查时间戳是否在5分钟内（防止重放攻击）
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  if (diff > 5 * 60 * 1000) {
    return false;
  }

  // 3. 验证签名
  const expectedSignature = generateSignature(payload, timestamp);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  // 长度不一致直接拒绝（timingSafeEqual 要求等长，否则会抛异常导致 500）
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * 为 API 请求添加签名
 * @param url 请求 URL
 * @param data 请求数据
 * @returns 带签名的请求配置
 */
export function signRequest(url: string, data: unknown) {
  const timestamp = Date.now();
  const signature = generateSignature(data, timestamp);
  
  return {
    url,
    data,
    headers: {
      'X-Signature': signature,
      'X-Timestamp': timestamp.toString(),
    },
  };
}
