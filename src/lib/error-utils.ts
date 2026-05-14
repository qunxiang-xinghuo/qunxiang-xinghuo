/**
 * 从 unknown error 中安全提取消息字符串
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * 检查 unknown error 是否包含特定 code（如 Prisma 错误码）
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as Record<string, unknown>).code);
  }
  return undefined;
}
