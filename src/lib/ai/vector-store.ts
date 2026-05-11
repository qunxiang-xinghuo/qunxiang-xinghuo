/**
 * v9.3: 向量存储 + 关键词索引（双模式自动降级）
 *
 * 核心设计：
 * 1. 优先尝试 DeepSeek 嵌入 API 获取语义向量
 * 2. 嵌入 API 不可用时，自动降级到关键词倒排索引
 * 3. 向量存储在内存，支持 JSON 文件持久化/加载
 * 4. 纯 JS 实现余弦相似度，零依赖
 */

import { db } from "@/lib/db";

// ── 类型定义 ──

export interface VectorDocument {
  id: string;
  type: "story" | "brainhole" | "persona";
  title: string;
  content: string;
  keywords: string[];
  embedding?: number[];
  metadata: Record<string, any>;
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
}

export interface SearchOptions {
  type?: "story" | "brainhole" | "persona";
  limit?: number;
  minScore?: number;
}

// ── 全局状态 ──

let _vectorIndex: VectorDocument[] = [];
let _keywordIndex: Map<string, Set<string>> = new Map();
let _embeddingAvailable = true; // 乐观假设，失败时降级
let _indexBuilt = false;

// ── DeepSeek 嵌入 API ──

const DEEPSEEK_EMBED_API = "https://api.deepseek.com/v1/embeddings";

async function getEmbedding(text: string): Promise<number[] | undefined> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || !_embeddingAvailable) return undefined;

  try {
    const res = await fetch(DEEPSEEK_EMBED_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 2000), // 限制长度
      }),
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 400) {
        console.warn("[VectorStore] DeepSeek 嵌入 API 不可用，降级到关键词索引");
        _embeddingAvailable = false;
      }
      return undefined;
    }

    const data = await res.json();
    const embedding = data.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) {
      _embeddingAvailable = false;
      return undefined;
    }
    return embedding;
  } catch (err: any) {
    console.warn("[VectorStore] 嵌入 API 调用失败:", err.message);
    _embeddingAvailable = false;
    return undefined;
  }
}

// ── 余弦相似度（纯 JS）──

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── 关键词提取（中文分词简化版）──

function extractKeywords(text: string): string[] {
  const keywords: string[] = [];

  // 中文：按字提取（简单但有效）+ 常见词组
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  keywords.push(...chineseChars);

  // 英文单词
  const englishWords = text.toLowerCase().match(/[a-z]+/g) || [];
  keywords.push(...englishWords);

  // 数字
  const numbers = text.match(/\d+/g) || [];
  keywords.push(...numbers);

  // 去重
  return [...new Set(keywords)];
}

function extractKeywordsWeighted(text: string): { word: string; weight: number }[] {
  const words = extractKeywords(text);
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return Array.from(freq.entries()).map(([word, count]) => ({
    word,
    weight: Math.sqrt(count), // TF 加权
  }));
}

// ── 关键词索引操作 ──

function addToKeywordIndex(doc: VectorDocument): void {
  for (const kw of doc.keywords) {
    const set = _keywordIndex.get(kw) || new Set<string>();
    set.add(doc.id);
    _keywordIndex.set(kw, set);
  }
}

function searchKeywordIndex(query: string, options: SearchOptions = {}): SearchResult[] {
  const queryKeywords = extractKeywords(query);
  const docScores = new Map<string, number>();

  for (const kw of queryKeywords) {
    const docIds = _keywordIndex.get(kw);
    if (!docIds) continue;
    for (const docId of docIds) {
      const doc = _vectorIndex.find((d) => d.id === docId);
      if (!doc) continue;
      if (options.type && doc.type !== options.type) continue;

      // 计算匹配分数：匹配关键词数 / 文档总关键词数
      const matched = doc.keywords.filter((dk) => queryKeywords.includes(dk)).length;
      const score = matched / Math.max(doc.keywords.length, 1);
      docScores.set(docId, Math.max(docScores.get(docId) || 0, score));
    }
  }

  const results: SearchResult[] = [];
  for (const [docId, score] of docScores) {
    const doc = _vectorIndex.find((d) => d.id === docId);
    if (doc) results.push({ document: doc, score });
  }

  return results
    .filter((r) => r.score >= (options.minScore || 0.05))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit || 10);
}

// ── 向量索引操作 ──

async function searchVectorIndex(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const queryEmbedding = await getEmbedding(query);
  if (!queryEmbedding) {
    // 嵌入不可用，降级到关键词
    return searchKeywordIndex(query, options);
  }

  const results: SearchResult[] = [];

  for (const doc of _vectorIndex) {
    if (options.type && doc.type !== options.type) continue;
    if (!doc.embedding) continue;

    const score = cosineSimilarity(queryEmbedding, doc.embedding);
    if (score >= (options.minScore || 0.5)) {
      results.push({ document: doc, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, options.limit || 10);
}

// ── 公共 API ──

/**
 * 搜索知识库（自动选择向量或关键词）
 */
export async function searchKnowledgeBase(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  if (!_indexBuilt) {
    console.warn("[VectorStore] 索引尚未构建，尝试构建...");
    await buildVectorIndex();
  }

  if (_embeddingAvailable) {
    return searchVectorIndex(query, options);
  }
  return searchKeywordIndex(query, options);
}

/**
 * 判断当前是否使用向量模式
 */
export function isVectorMode(): boolean {
  return _embeddingAvailable;
}

/**
 * 获取索引统计
 */
export function getIndexStats(): { total: number; stories: number; brainholes: number; personas: number; mode: string } {
  return {
    total: _vectorIndex.length,
    stories: _vectorIndex.filter((d) => d.type === "story").length,
    brainholes: _vectorIndex.filter((d) => d.type === "brainhole").length,
    personas: _vectorIndex.filter((d) => d.type === "persona").length,
    mode: _embeddingAvailable ? "vector" : "keyword",
  };
}

// ── 索引构建 ──

/**
 * 从数据库构建向量索引
 * 应用启动时调用一次
 */
export async function buildVectorIndex(): Promise<void> {
  if (_indexBuilt) return;

  console.log("[VectorStore] 开始构建知识库索引...");
  const startTime = Date.now();

  _vectorIndex = [];
  _keywordIndex = new Map();

  try {
    // 1. 索引故事
    const stories = await db.story.findMany({
      where: { status: { in: ["open", "recruiting"] } },
      select: {
        id: true,
        title: true,
        eraBackground: true,
        storySummary: true,
        act1Reveal: true,
        act2Reveal: true,
        act3Reveal: true,
        act4Truth: true,
        difficulty: true,
        maxCharacters: true,
        hotScore: true,
      },
    });

    for (const story of stories) {
      const content = [
        story.title,
        story.eraBackground,
        story.storySummary,
        story.act1Reveal,
        story.act2Reveal,
        story.act3Reveal,
        story.act4Truth,
      ]
        .filter(Boolean)
        .join(" ");

      const keywords = extractKeywords(content);
      let embedding: number[] | undefined;

      if (_embeddingAvailable) {
        embedding = await getEmbedding(content.slice(0, 1500));
      }

      const doc: VectorDocument = {
        id: story.id,
        type: "story",
        title: story.title,
        content: content.slice(0, 2000),
        keywords,
        embedding,
        metadata: {
          difficulty: story.difficulty,
          maxCharacters: story.maxCharacters,
          hotScore: story.hotScore,
        },
      };

      _vectorIndex.push(doc);
      addToKeywordIndex(doc);
    }

    console.log(`[VectorStore] 索引了 ${stories.length} 个故事`);

    // 2. 索引脑洞
    const brainholes = await db.brainhole.findMany({
      where: { status: "approved" },
      select: {
        id: true,
        title: true,
        scenario: true,
        category: true,
        tags: { select: { tag: { select: { name: true } } } },
        hotScore: true,
      },
    });

    for (const bh of brainholes) {
      const tagNames = bh.tags.map((t) => t.tag.name).join(" ");
      const content = [bh.title, bh.scenario, bh.category, tagNames].filter(Boolean).join(" ");
      const keywords = extractKeywords(content);
      let embedding: number[] | undefined;

      if (_embeddingAvailable) {
        embedding = await getEmbedding(content.slice(0, 1500));
      }

      const doc: VectorDocument = {
        id: bh.id,
        type: "brainhole",
        title: bh.title,
        content: content.slice(0, 2000),
        keywords,
        embedding,
        metadata: {
          category: bh.category,
          hotScore: bh.hotScore,
          tags: tagNames,
        },
      };

      _vectorIndex.push(doc);
      addToKeywordIndex(doc);
    }

    console.log(`[VectorStore] 索引了 ${brainholes.length} 个脑洞`);

    // 3. 索引角色（用于意图匹配）
    const personaTexts = [
      { id: "companion", name: "陪伴员", desc: "人机陪伴 AI房间 聊天 话题" },
      { id: "dungeon_master", name: "剧情DM", desc: "短故事 主持 守夜人 引导 神秘" },
      { id: "story_fallback", name: "角色替身", desc: "匹配超时 代替角色 扮演" },
      { id: "assistant_director", name: "副导演", desc: "长故事 辅助导演 建议" },
      { id: "catalyst", name: "催化剂", desc: "双人脑洞 催化 提问 旁观者" },
      { id: "healer", name: "疗愈师", desc: "个人疗愈 倾听 安全 情绪 心理" },
      { id: "reviewer", name: "审稿人", desc: "审核 脏话 人身攻击 结束" },
      { id: "summarizer", name: "提炼师", desc: "总结 火花 保存 推荐语" },
      { id: "knowledge_feeder", name: "知识投喂员", desc: "知识 抓取 引导问题" },
      { id: "mediator", name: "调解员", desc: "多人对话 调解 中立" },
      { id: "creative", name: "创作助手", desc: "创作瓶颈 辅助 选项" },
    ];

    for (const p of personaTexts) {
      const content = `${p.name} ${p.desc}`;
      const keywords = extractKeywords(content);
      let embedding: number[] | undefined;

      if (_embeddingAvailable) {
        embedding = await getEmbedding(content);
      }

      const doc: VectorDocument = {
        id: p.id,
        type: "persona",
        title: p.name,
        content,
        keywords,
        embedding,
        metadata: {},
      };

      _vectorIndex.push(doc);
      addToKeywordIndex(doc);
    }

    _indexBuilt = true;
    const elapsed = Date.now() - startTime;
    console.log(
      `[VectorStore] 索引构建完成: ${_vectorIndex.length} 条文档, 模式: ${_embeddingAvailable ? "vector" : "keyword"}, 耗时: ${elapsed}ms`
    );
  } catch (err: any) {
    console.error("[VectorStore] 索引构建失败:", err.message);
    _embeddingAvailable = false;
    _indexBuilt = true; // 标记为已构建（空索引）
  }
}

/**
 * 强制降级到关键词模式（用于嵌入 API 不可用时）
 */
export function forceKeywordMode(): void {
  _embeddingAvailable = false;
  console.log("[VectorStore] 已强制降级到关键词模式");
}

/**
 * 重置索引（数据变化时调用）
 */
export async function rebuildIndex(): Promise<void> {
  _indexBuilt = false;
  _embeddingAvailable = true; // 重置时重新尝试嵌入
  await buildVectorIndex();
}
