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
// WARNING: 这些变量是模块级全局变量，在 Serverless/Edge 环境中不可靠
//          每个实例独立，可能导致索引重复构建。当前部署在腾讯云单机，可用。
//          如果未来迁移到 Serverless，需要改为外部存储（Redis/DB）。
let _vectorIndex: VectorDocument[] = [];
let _keywordIndex: Map<string, Set<string>> = new Map();
let _embeddingAvailable = true;
let _indexBuilt = false;

// v9.3-fix: 嵌入 API 定时重试（每5分钟检查一次）
let _embedRetryTimer: ReturnType<typeof setInterval> | null = null;

// v9.3-fix: 嵌入结果缓存（LRU，最多 100 条）
const _embedCache = new Map<string, number[]>();
const MAX_EMBED_CACHE = 100;

// ── DeepSeek 嵌入 API ──

const DEEPSEEK_EMBED_API = "https://api.deepseek.com/v1/embeddings";

async function getEmbedding(text: string): Promise<number[] | undefined> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || !_embeddingAvailable) return undefined;

  // v9.3-fix: 缓存命中直接返回
  const cacheKey = text.slice(0, 200);
  if (_embedCache.has(cacheKey)) {
    return _embedCache.get(cacheKey);
  }

  try {
    const res = await fetch(DEEPSEEK_EMBED_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 2000),
      }),
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 400) {
        console.warn("[VectorStore] DeepSeek 嵌入 API 不可用，降级到关键词索引");
        _embeddingAvailable = false;
      }
      // v9.3-fix: 非 404/400 错误时临时降级，下次请求会重试
      if (res.status >= 500) {
        console.warn("[VectorStore] 嵌入 API 服务端错误，下次请求将重试");
      }
      return undefined;
    }

    const data = await res.json();
    const embedding = data.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) {
      _embeddingAvailable = false;
      return undefined;
    }

    // v9.3-fix: 写入缓存
    if (_embedCache.size >= MAX_EMBED_CACHE) {
      const firstKey = _embedCache.keys().next().value;
      if (firstKey) _embedCache.delete(firstKey);
    }
    _embedCache.set(cacheKey, embedding);

    return embedding;
  } catch (err: any) {
    console.warn("[VectorStore] 嵌入 API 调用失败:", err.message);
    // v9.3-fix: 网络错误临时降级，下次请求会重试
    if (err.message?.includes("fetch") || err.message?.includes("network")) {
      console.warn("[VectorStore] 网络错误，下次请求将重试嵌入 API");
    } else {
      _embeddingAvailable = false;
    }
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

// 中文停用词（简化版）
const STOP_WORDS = new Set([
  "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一", "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好", "自己", "这", "那", "这些", "那些", "这个", "那个", "之", "与", "及", "等", "或", "但", "而", "因为", "所以", "如果", "虽然", "然而", "并且", "以及", "但是", "还是", "就是", "不是", "不能", "可以", "需要", "进行", "通过", "作为", "对于", "关于", "根据", "按照", "随着", "由于", "为了", "为", "被", "把", "让", "给", "向", "从", "到", "在", "于", "以", "及", "等", "第",
]);

function extractKeywords(text: string): string[] {
  const keywords: string[] = [];

  // 中文：提取二字/三字词组，过滤停用词和单字
  const chineseText = text.replace(/[^\u4e00-\u9fa5]/g, "");
  for (let i = 0; i < chineseText.length - 1; i++) {
    const word2 = chineseText.slice(i, i + 2);
    if (!STOP_WORDS.has(word2)) keywords.push(word2);
    if (i < chineseText.length - 2) {
      const word3 = chineseText.slice(i, i + 3);
      if (!STOP_WORDS.has(word3)) keywords.push(word3);
    }
  }

  // 英文单词（长度≥2）
  const englishWords = text.toLowerCase().match(/[a-z]+/g) || [];
  keywords.push(...englishWords.filter((w) => w.length >= 2));

  // 数字（长度≥2，如"明朝"不算，但"2024"算）
  const numbers = text.match(/\d+/g) || [];
  keywords.push(...numbers.filter((n) => n.length >= 2));

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
  const docScores = new Map<string, { matched: number; totalDocKw: number }>();

  for (const kw of queryKeywords) {
    const docIds = _keywordIndex.get(kw);
    if (!docIds) continue;
    for (const docId of docIds) {
      const doc = _vectorIndex.find((d) => d.id === docId);
      if (!doc) continue;
      if (options.type && doc.type !== options.type) continue;

      const prev = docScores.get(docId);
      if (prev) {
        prev.matched += 1;
      } else {
        docScores.set(docId, { matched: 1, totalDocKw: doc.keywords.length });
      }
    }
  }

  const results: SearchResult[] = [];
  for (const [docId, { matched, totalDocKw }] of docScores) {
    const doc = _vectorIndex.find((d) => d.id === docId);
    if (!doc) continue;
    // v9.3-fix: 改用 BM25 式评分 = matched / queryLength * log(totalDocs / docFreq)
    // 简化版：matched / queryKeywords.length（对长文档更公平）
    const queryCoverage = matched / Math.max(queryKeywords.length, 1);
    const docDensity = matched / Math.max(totalDocKw, 1);
    // v9.3-fix: 评分公式改为 matched / queryKeywords.length（对长文档更公平）
    const score = matched / Math.max(queryKeywords.length, 1);
    results.push({ document: doc, score });
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

// v9.3-fix: 批量获取嵌入（将多个文本合并为一次 API 调用）
async function getEmbeddingsBatch(texts: string[]): Promise<(number[] | undefined)[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || !_embeddingAvailable) {
    return texts.map(() => undefined);
  }

  // 先检查缓存
  const results: (number[] | undefined)[] = [];
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const cacheKey = texts[i].slice(0, 200);
    if (_embedCache.has(cacheKey)) {
      results[i] = _embedCache.get(cacheKey);
    } else {
      results[i] = undefined;
      uncachedIndices.push(i);
      uncachedTexts.push(texts[i].slice(0, 2000));
    }
  }

  if (uncachedTexts.length === 0) return results;

  try {
    const res = await fetch(DEEPSEEK_EMBED_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: uncachedTexts,
      }),
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 400) {
        console.warn("[VectorStore] DeepSeek 嵌入 API 不可用，降级到关键词索引");
        _embeddingAvailable = false;
      }
      return results;
    }

    const data = await res.json();
    const embeddings = data.data?.map((d: any) => d.embedding) || [];

    for (let i = 0; i < uncachedIndices.length; i++) {
      const emb = embeddings[i];
      if (Array.isArray(emb)) {
        const idx = uncachedIndices[i];
        results[idx] = emb;
        // 写入缓存
        const cacheKey = texts[idx].slice(0, 200);
        if (_embedCache.size >= MAX_EMBED_CACHE) {
          const firstKey = _embedCache.keys().next().value;
          if (firstKey) _embedCache.delete(firstKey);
        }
        _embedCache.set(cacheKey, emb);
      }
    }
  } catch (err: any) {
    console.warn("[VectorStore] 批量嵌入 API 调用失败:", err.message);
  }

  return results;
}

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

    // v9.3-fix: 批量获取嵌入
    const storyContents = stories.map((story) =>
      [
        story.title,
        story.eraBackground,
        story.storySummary,
        story.act1Reveal,
        story.act2Reveal,
        story.act3Reveal,
        story.act4Truth,
      ]
        .filter(Boolean)
        .join(" ")
        .slice(0, 1500)
    );
    const storyEmbeddings = _embeddingAvailable
      ? await getEmbeddingsBatch(storyContents)
      : stories.map(() => undefined);

    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      const content = storyContents[i];
      const keywords = extractKeywords(content);

      const doc: VectorDocument = {
        id: story.id,
        type: "story",
        title: story.title,
        content: content.slice(0, 2000),
        keywords,
        embedding: storyEmbeddings[i],
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

    // v9.3-fix: 批量获取嵌入
    const bhContents = brainholes.map((bh) => {
      const tagNames = bh.tags.map((t) => t.tag.name).join(" ");
      return [bh.title, bh.scenario, bh.category, tagNames].filter(Boolean).join(" ").slice(0, 1500);
    });
    const bhEmbeddings = _embeddingAvailable
      ? await getEmbeddingsBatch(bhContents)
      : brainholes.map(() => undefined);

    for (let i = 0; i < brainholes.length; i++) {
      const bh = brainholes[i];
      const content = bhContents[i];
      const keywords = extractKeywords(content);

      const doc: VectorDocument = {
        id: bh.id,
        type: "brainhole",
        title: bh.title,
        content: content.slice(0, 2000),
        keywords,
        embedding: bhEmbeddings[i],
        metadata: {
          category: bh.category,
          hotScore: bh.hotScore,
          tags: bh.tags.map((t) => t.tag.name).join(" "),
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

    // v9.3-fix: 批量获取嵌入
    const personaContents = personaTexts.map((p) => `${p.name} ${p.desc}`);
    const personaEmbeddings = _embeddingAvailable
      ? await getEmbeddingsBatch(personaContents)
      : personaTexts.map(() => undefined);

    for (let i = 0; i < personaTexts.length; i++) {
      const p = personaTexts[i];
      const content = personaContents[i];
      const keywords = extractKeywords(content);

      const doc: VectorDocument = {
        id: p.id,
        type: "persona",
        title: p.name,
        content,
        keywords,
        embedding: personaEmbeddings[i],
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

    // v9.3-fix: 启动定时重试（每5分钟检查嵌入 API 是否恢复）
    if (!_embeddingAvailable && !_embedRetryTimer) {
      _embedRetryTimer = setInterval(async () => {
        console.log("[VectorStore] 定时重试嵌入 API...");
        _embeddingAvailable = true;
        const testEmb = await getEmbedding("测试");
        if (testEmb) {
          console.log("[VectorStore] 嵌入 API 已恢复，切换回向量模式");
          if (_embedRetryTimer) {
            clearInterval(_embedRetryTimer);
            _embedRetryTimer = null;
          }
          // 重建索引以获取向量
          await rebuildIndex();
        } else {
          _embeddingAvailable = false;
          console.log("[VectorStore] 嵌入 API 仍未恢复，继续关键词模式");
        }
      }, 5 * 60 * 1000); // 5分钟
    }
  } catch (err: any) {
    console.error("[VectorStore] 索引构建失败:", err.message);
    _embeddingAvailable = false;
    _indexBuilt = true;
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
  _embeddingAvailable = true;
  // 清理旧定时器，避免重复
  if (_embedRetryTimer) {
    clearInterval(_embedRetryTimer);
    _embedRetryTimer = null;
  }
  await buildVectorIndex();
}
