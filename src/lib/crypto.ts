import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const envKey = process.env.HEALING_ENCRYPTION_KEY;
  if (envKey) {
    // 从环境变量派生32字节密钥
    return crypto.createHash("sha256").update(envKey).digest();
  }
  // 开发环境fallback：基于项目名派生固定密钥（仅开发使用）
  return crypto.createHash("sha256").update("qunxiang-xinghuo-healing-dev-key-2026").digest();
}

const MASTER_KEY = getKey();

/**
 * AES-256-GCM 加密
 * 返回格式: base64(iv + authTag + ciphertext)
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // 拼接: iv (16) + authTag (16) + ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * AES-256-GCM 解密
 * 输入格式: base64(iv + authTag + ciphertext)
 */
export function decrypt(ciphertextBase64: string): string {
  const combined = Buffer.from(ciphertextBase64, "base64");
  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid ciphertext: too short");
  }
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf-8");
}

/**
 * 批量加密对象中的指定字段
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    if (typeof result[field] === "string" && result[field]) {
      (result as Record<string, string>)[field as string] = encrypt(result[field] as string);
    }
  }
  return result;
}

/**
 * 批量解密对象中的指定字段
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    if (typeof result[field] === "string" && result[field]) {
      try {
        (result as Record<string, string>)[field as string] = decrypt(result[field] as string);
      } catch (e) {
        // 如果解密失败（明文存储的旧数据），保持原值
        console.warn(`[Crypto] Decrypt failed for field ${String(field)}, using raw value`);
      }
    }
  }
  return result;
}
