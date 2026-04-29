/**
 * 知乎圈子开放平台 API 客户端
 * 文档: 比赛要求.docx - 圈子 API 快速开始
 * Base URL: https://openapi.zhihu.com/
 * 圈子ID: 2001009660925334090
 */

import crypto from "crypto";

const ZHIHU_BASE_URL = "https://openapi.zhihu.com";
const ZHIHU_RING_ID = "2001009660925334090";

function getCredentials() {
  const appKey = process.env.ZHIHU_APP_KEY;
  const appSecret = process.env.ZHIHU_APP_SECRET;
  if (!appKey || !appSecret) {
    throw new Error("ZHIHU_APP_KEY 或 ZHIHU_APP_SECRET 未配置");
  }
  return { appKey, appSecret };
}

/**
 * 生成 HMAC-SHA256 签名
 * 签名格式: app_key:{app_key}|ts:{timestamp}|logid:{log_id}|extra_info:{extra_info}
 */
function generateSign(
  appKey: string,
  appSecret: string,
  timestamp: string,
  logId: string,
  extraInfo: string = ""
): string {
  const signStr = `app_key:${appKey}|ts:${timestamp}|logid:${logId}|extra_info:${extraInfo}`;
  const hmac = crypto.createHmac("sha256", appSecret);
  hmac.update(signStr);
  return hmac.digest("base64");
}

/**
 * 构建带鉴权头的请求参数
 */
function buildAuthHeaders() {
  const { appKey, appSecret } = getCredentials();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const logId = `xinghuo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sign = generateSign(appKey, appSecret, timestamp, logId, "");

  return {
    "X-App-Key": appKey,
    "X-Timestamp": timestamp,
    "X-Log-Id": logId,
    "X-Sign": sign,
    "X-Extra-Info": "",
    "Content-Type": "application/json",
  };
}

// ==================== 类型定义 ====================

export interface ZhihuRingInfo {
  ring_id: string;
  ring_name: string;
  ring_desc: string;
  ring_avatar: string;
  membership_num: number;
  discussion_num: number;
}

export interface ZhihuComment {
  comment_id: string;
  content: string;
  author_name: string;
  author_token: string;
  like_count: number;
  reply_count: number;
  reply_to?: string;
  publish_time: number;
}

export interface ZhihuPin {
  pin_id: number;
  content: string;
  author_name: string;
  images: string[];
  publish_time: number;
  like_num: number;
  comment_num: number;
  share_num: number;
  fav_num: number;
  comments?: ZhihuComment[];
}

export interface ZhihuRingDetailResponse {
  status: number;
  msg: string;
  data: {
    ring_info: ZhihuRingInfo;
    contents: ZhihuPin[];
  };
}

export interface ZhihuCommentListResponse {
  status: number;
  msg: string;
  data: {
    comments: ZhihuComment[];
    has_more: boolean;
  };
}

export interface ZhihuPublishResponse {
  status: number;
  msg: string;
  data: { content_token: string } | null;
}

export interface ZhihuReactionResponse {
  status: number;
  msg: string;
  data: { success: boolean } | null;
}

// ==================== API 方法 ====================

/**
 * 获取圈子详情和内容列表
 */
export async function getRingDetail(
  ringId: string = ZHIHU_RING_ID,
  pageNum: number = 1,
  pageSize: number = 20
): Promise<ZhihuRingDetailResponse> {
  const headers = buildAuthHeaders();
  const url = `${ZHIHU_BASE_URL}/openapi/ring/detail?ring_id=${ringId}&page_num=${pageNum}&page_size=${pageSize}`;

  const res = await fetch(url, { headers, next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`知乎 API 错误: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * 在圈子中发布想法
 * ⚠️ 每小时最多5条
 */
export async function publishPin(params: {
  title: string;
  content: string;
  imageUrls?: string[];
  ringId?: string;
}): Promise<ZhihuPublishResponse> {
  const headers = buildAuthHeaders();
  const body = {
    title: params.title,
    content: params.content,
    image_urls: params.imageUrls || [],
    ring_id: params.ringId || ZHIHU_RING_ID,
  };

  const res = await fetch(`${ZHIHU_BASE_URL}/openapi/publish/pin`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok && res.status !== 400) {
    throw new Error(`知乎发布失败: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * 获取评论列表
 */
export async function getCommentList(params: {
  contentToken: string;
  contentType: "pin" | "comment";
  pageNum?: number;
  pageSize?: number;
}): Promise<ZhihuCommentListResponse> {
  const headers = buildAuthHeaders();
  const { contentToken, contentType, pageNum = 1, pageSize = 10 } = params;
  const url =
    `${ZHIHU_BASE_URL}/openapi/comment/list` +
    `?content_token=${contentToken}&content_type=${contentType}&page_num=${pageNum}&page_size=${pageSize}`;

  const res = await fetch(url, { headers, next: { revalidate: 30 } });
  if (!res.ok) {
    throw new Error(`知乎 API 错误: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * 创建评论（一级评论或回复）
 * ⚠️ 每小时每个想法下最多20条
 */
export async function createComment(params: {
  contentToken: string;
  contentType: "pin" | "comment";
  content: string;
}): Promise<{ code: number; msg: string; data: { comment_id: number } | null }> {
  const headers = buildAuthHeaders();
  const body = {
    content_token: params.contentToken,
    content_type: params.contentType,
    content: params.content,
  };

  const res = await fetch(`${ZHIHU_BASE_URL}/openapi/comment/create`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok && res.status !== 400) {
    throw new Error(`知乎评论失败: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * 删除评论
 */
export async function deleteComment(commentId: string): Promise<{
  status: number;
  msg: string;
  data: { success: boolean } | null;
}> {
  const headers = buildAuthHeaders();
  const res = await fetch(`${ZHIHU_BASE_URL}/openapi/comment/delete`, {
    method: "POST",
    headers,
    body: JSON.stringify({ comment_id: commentId }),
  });

  if (!res.ok) {
    throw new Error(`知乎删除评论失败: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * 点赞 / 取消点赞
 */
export async function toggleReaction(params: {
  contentToken: string;
  contentType: "pin" | "comment";
  actionValue: 0 | 1;
}): Promise<ZhihuReactionResponse> {
  const headers = buildAuthHeaders();
  const body = {
    content_token: params.contentToken,
    content_type: params.contentType,
    action_type: "like",
    action_value: params.actionValue,
  };

  const res = await fetch(`${ZHIHU_BASE_URL}/openapi/reaction`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`知乎点赞失败: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export { ZHIHU_RING_ID };
