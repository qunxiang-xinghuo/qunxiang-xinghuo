/**
 * 知乎开发者平台 API 客户端
 * 文档: API.docx - 知乎搜索/全网搜索/直答/热榜
 * Base URL: https://developer.zhihu.com/api/v1
 * 鉴权: Bearer Token + X-Request-Timestamp
 */

const ZHIHU_DEV_BASE_URL = "https://developer.zhihu.com/api/v1";

function getAccessSecret(): string {
  const secret = process.env.ZHIHU_APP_KEY;
  if (!secret) {
    throw new Error("ZHIHU_APP_KEY (Access Secret) 未配置");
  }
  return secret;
}

function buildAuthHeaders() {
  const accessSecret = getAccessSecret();
  const timestamp = Math.floor(Date.now() / 1000).toString();

  return {
    Authorization: `Bearer ${accessSecret}`,
    "X-Request-Timestamp": timestamp,
    "Content-Type": "application/json",
  };
}

// ==================== 类型定义 ====================

export interface ZhihuSearchItem {
  Title: string;
  ContentType: string; // "Article" | "Answer" | "Question"
  ContentID: string;
  ContentText: string;
  Url: string;
  CommentCount: number;
  VoteUpCount: number;
  AuthorName: string;
  AuthorAvatar: string;
  AuthorBadge: string;
  AuthorBadgeText: string;
  EditTime: number;
  CommentInfoList: Array<{
    Content: string;
  }>;
  AuthorityLevel: string;
  RankingScore: number;
}

export interface ZhihuSearchResponse {
  Code: number;
  Message: string;
  Data: {
    HasMore: boolean;
    SearchHashId: string;
    Items: ZhihuSearchItem[];
  };
}

export interface ZhihuHotListItem {
  Title: string;
  Url: string;
  ThumbnailUrl: string;
  Summary: string;
}

export interface ZhihuHotListResponse {
  Code: number;
  Message: string;
  Data: {
    Total: number;
    Items: ZhihuHotListItem[];
  };
}

export interface ZhihuZhidaMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ZhihuZhidaChoice {
  index: number;
  message: {
    role: string;
    reasoning_content?: string;
    content: string;
  };
  finish_reason: string;
}

export interface ZhihuZhidaResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ZhihuZhidaChoice[];
}

// ==================== API 方法 ====================

/**
 * 知乎站内搜索
 * @param query 搜索关键词
 * @param count 返回数量 (1-10, 默认10)
 */
export async function zhihuSearch(
  query: string,
  count: number = 10
): Promise<ZhihuSearchResponse> {
  const headers = buildAuthHeaders();
  const params = new URLSearchParams();
  params.set("Query", query);
  params.set("Count", Math.min(Math.max(count, 1), 10).toString());

  const url = `${ZHIHU_DEV_BASE_URL}/content/zhihu_search?${params.toString()}`;
  const res = await fetch(url, { headers, next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error(`知乎搜索 API 错误: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * 全网搜索
 * @param query 搜索关键词
 * @param count 返回数量 (1-10, 默认10)
 */
export async function globalSearch(
  query: string,
  count: number = 10
): Promise<ZhihuSearchResponse> {
  const headers = buildAuthHeaders();
  const params = new URLSearchParams();
  params.set("Query", query);
  params.set("Count", Math.min(Math.max(count, 1), 10).toString());

  const url = `${ZHIHU_DEV_BASE_URL}/content/global_search?${params.toString()}`;
  const res = await fetch(url, { headers, next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error(`全网搜索 API 错误: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * 知乎热榜
 * @param limit 返回数量 (1-30, 默认30)
 */
export async function getHotList(
  limit: number = 30
): Promise<ZhihuHotListResponse> {
  const headers = buildAuthHeaders();
  const params = new URLSearchParams();
  params.set("Limit", Math.min(Math.max(limit, 1), 30).toString());

  const url = `${ZHIHU_DEV_BASE_URL}/content/hot_list?${params.toString()}`;
  const res = await fetch(url, { headers, next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error(`知乎热榜 API 错误: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * 知乎直答 (非流式)
 * @param messages 对话消息列表
 * @param model 模型: zhida-fast-1p5 | zhida-thinking-1p5
 */
export async function zhidaChat(
  messages: ZhihuZhidaMessage[],
  model: "zhida-fast-1p5" | "zhida-thinking-1p5" = "zhida-thinking-1p5"
): Promise<ZhihuZhidaResponse> {
  const headers = buildAuthHeaders();
  const body = {
    model,
    messages,
    stream: false,
  };

  const res = await fetch(`${ZHIHU_DEV_BASE_URL}/content/zhida`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`知乎直答 API 错误: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * 将知乎搜索结果转换为脑洞素材格式
 */
export function searchResultToBrainholeMaterial(item: ZhihuSearchItem) {
  return {
    title: item.Title,
    source: "zhihu_search",
    content: item.ContentText.slice(0, 500),
    url: item.Url,
    author: item.AuthorName,
    votes: item.VoteUpCount,
    comments: item.CommentCount,
    authority: item.AuthorityLevel,
  };
}

/**
 * 将热榜条目转换为脑洞素材格式
 */
export function hotListToBrainholeMaterial(item: ZhihuHotListItem) {
  return {
    title: item.Title,
    source: "zhihu_hotlist",
    content: item.Summary || item.Title,
    url: item.Url,
    thumbnail: item.ThumbnailUrl,
  };
}
