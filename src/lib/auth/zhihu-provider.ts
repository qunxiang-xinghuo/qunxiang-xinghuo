/**
 * 知乎 OAuth 2.0 Provider
 *
 * 适配知乎开放平台 OAuth 流程（官方文档）：
 * Base URL: https://openapi.zhihu.com/
 *
 * 1. 授权: GET https://openapi.zhihu.com/authorize
 *    参数: app_id, redirect_uri, response_type=code
 *
 * 2. 换 token: POST https://openapi.zhihu.com/access_token
 *    参数: app_id, app_key, grant_type=authorization_code, redirect_uri, code
 *
 * 3. 用户信息: GET https://openapi.zhihu.com/user
 *    Header: Authorization: Bearer {access_token}
 *    响应: { uid, hash_id, fullname, gender, headline, description, avatar_path, url, email, phone_no }
 *
 * 4. 公共错误: 所有接口返回 HTTP 200，body 含 { code, data } 表示错误
 *    code 401 = 鉴权失败, 403 = 权限不足, 404 = 用户不存在
 *
 * 文档: https://open.zhihu.com/
 */

import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

export interface ZhihuProfile {
  uid: number;
  hash_id?: string;
  fullname: string;
  gender?: string;
  headline?: string;
  description?: string;
  avatar_path?: string;
  url?: string;
  email?: string;
  phone_no?: string;
}

/** 知乎接口通用错误响应 */
interface ZhihuErrorResponse {
  code: number;
  data: string;
}

function isZhihuError(data: unknown): data is ZhihuErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    typeof (data as ZhihuErrorResponse).code === "number" &&
    (data as ZhihuErrorResponse).code !== 0
  );
}

function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

/**
 * 知乎 OAuth Provider
 *
 * 环境变量需要：
 * - ZHIHU_APP_ID     （知乎开放平台申请的 APP_ID）
 * - ZHIHU_APP_KEY    （知乎开放平台申请的 APP_KEY）
 * - NEXTAUTH_URL     （回调地址基址，如 https://your-domain.com）
 */
export default function ZhihuProvider(
  options: OAuthUserConfig<ZhihuProfile>
): OAuthConfig<ZhihuProfile> {
  const appId = process.env.ZHIHU_APP_ID;
  const appKey = process.env.ZHIHU_APP_KEY;

  if (!appId || !appKey) {
    console.warn("[Zhihu OAuth] ZHIHU_APP_ID 或 ZHIHU_APP_KEY 未配置，知乎登录不可用");
  }

  return {
    id: "zhihu",
    name: "知乎",
    type: "oauth",
    version: "2.0",
    // 授权地址（官方文档: https://openapi.zhihu.com/authorize）
    authorization: {
      url: "https://openapi.zhihu.com/authorize",
      params: {
        app_id: appId || "",
        redirect_uri: `${getBaseUrl()}/api/auth/callback/zhihu`,
        response_type: "code",
      },
    },
    // 换 token —— 知乎接口非标准，需要自定义 request
    token: {
      url: "https://openapi.zhihu.com/access_token",
      async request(context) {
        const { provider, params } = context;
        const redirectUri = `${getBaseUrl()}/api/auth/callback/zhihu`;

        const code = params.code || (params as any).authorization_code || "";
        console.log("[Zhihu OAuth] 回调参数:", { code: params.code, authorization_code: (params as any).authorization_code });

        if (!code) {
          throw new Error("知乎 OAuth 回调缺少 authorization_code 参数");
        }

        const body = new URLSearchParams();
        body.append("app_id", appId || "");
        body.append("app_key", appKey || "");
        body.append("grant_type", "authorization_code");
        body.append("redirect_uri", redirectUri);
        body.append("code", code);

        console.log("[Zhihu OAuth] 换取 access_token...");
        const tokenUrl = typeof provider.token === "string" ? provider.token : (provider.token as any).url;
        const res = await fetch(tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": String(Buffer.byteLength(body.toString())),
          },
          body,
        });

        const tokens = await res.json();

        // 知乎接口返回 HTTP 200，但 body 可能含业务错误 { code, data }
        if (isZhihuError(tokens)) {
          console.error("[Zhihu OAuth] 换 token 业务错误:", tokens.code, tokens.data);
          throw new Error(`知乎 OAuth 换 token 失败: [${tokens.code}] ${tokens.data}`);
        }

        if (!res.ok || !tokens.access_token) {
          console.error("[Zhihu OAuth] 换 token 失败:", res.status, JSON.stringify(tokens));
          throw new Error(`知乎 OAuth 换 token 失败: ${res.status}`);
        }

        console.log("[Zhihu OAuth] access_token 获取成功");
        return {
          tokens: {
            access_token: tokens.access_token,
            token_type: tokens.token_type || "Bearer",
            expires_in: tokens.expires_in,
            refresh_token: tokens.refresh_token,
          },
        };
      },
    },
    // 获取用户信息 —— 知乎开放平台 /user 接口
    userinfo: {
      url: "https://openapi.zhihu.com/user",
      async request(context) {
        const { tokens } = context;
        const res = await fetch("https://openapi.zhihu.com/user", {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        // 知乎接口返回 HTTP 200，但 body 可能含业务错误 { code, data }
        if (isZhihuError(data)) {
          console.error("[Zhihu OAuth] 获取用户信息业务错误:", data.code, data.data);
          throw new Error(`知乎 OAuth 获取用户信息失败: [${data.code}] ${data.data}`);
        }

        if (!res.ok) {
          console.error("[Zhihu OAuth] 获取用户信息 HTTP 错误:", res.status, JSON.stringify(data));
          throw new Error(`知乎 OAuth 获取用户信息失败: ${res.status}`);
        }

        return data;
      },
    },
    // 映射到 next-auth User 对象
    profile(profile) {
      const uidStr = String(profile.uid);
      console.log("[Zhihu OAuth] 用户信息:", profile.fullname, "uid:", uidStr);
      return {
        id: `zhihu_${uidStr}`, // 前缀区分知乎用户
        name: profile.fullname || "知乎用户",
        email: profile.email && profile.email.trim()
          ? profile.email
          : `${uidStr}@zhihu.oauth`, // 未授权 email 时用占位符
        image: profile.avatar_path || null,
        username: `zhihu_${uidStr}`, // v9.5-fix: 使用唯一 uid 避免 username 冲突
        level: 1,
        sparkCount: 0,
        isAdmin: false,
      };
    },
    style: {
      logo: "/zhihu-logo.svg",
      bg: "#0066FF",
      text: "#FFFFFF",
    },
    ...options,
    // 参考 oauthtest/参考.js 第 198-202 行：知乎回调回传 state 参数，启用 CSRF 校验
    checks: ["state"],
  };
}
