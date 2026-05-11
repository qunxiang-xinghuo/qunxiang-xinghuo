/**
 * v9.3: 意图路由器
 *
 * 轻量级包装器，委托给 RAGEngine 进行意图分类。
 * 提供独立的 classify API，供 chat route 直接调用。
 */

import { RAGEngine, type WorkflowType, type RAGIntent, type RAGResult } from "./rag-engine";

export { WorkflowType, RAGIntent, RAGResult };
export { RAGEngine };

/**
 * 快速意图分类（供外部调用）
 */
export async function classifyIntent(message: string): Promise<RAGIntent> {
  const result = await RAGEngine.retrieve(message);
  return result.intent;
}

/**
 * 完整 RAG 检索（意图 + 文档）
 */
export async function retrieveWithIntent(message: string): Promise<RAGResult> {
  return RAGEngine.retrieve(message);
}
