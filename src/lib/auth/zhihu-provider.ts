/**
 * 知乎 OAuth 2.0 Provider
 *
 * 适配知乎开放平台 OAuth 流程：
 * 1. 授权: https://www.zhihu.com/oauth2/authorize?app_id=xxx&redirect_uri=xxx&response_type=code
 * 2. 换 token: POST https://openapi.zhihu.com/access_token
 *    参数: app_id, app_key, grant_type=authorization_code, redirect_uri, code
 * 3. 用户信息: GET https://api.zhihu.com/me (Bearer access_token)
 *
 * 文档: https://open.zhihu.com/
 */

import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

export interface ZhihuProfile {
  id: string;
  name: string;
  avatar_url: string;
  headline?: string;
  description?: string;
  url?: string;
  url_token?: string;
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
    // 授权地址
    authorization: {
      url: "https://www.zhihu.com/oauth2/authorize",
      params: {
        app_id: appId || "",
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/zhihu`,
        response_type: "code",
      },
    },
    // 换 token —— 知乎接口非标准，需要自定义 request
    token: {
      url: "https://openapi.zhihu.com/access_token",
      async request(context) {
        const { provider, params } = context;
        const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/zhihu`;

        const body = new URLSearchParams();
        body.append("app_id", appId || "");
        body.append("app_key", appKey || "");
        body.append("grant_type", "authorization_code");
        body.append("redirect_uri", redirectUri);
        body.append("code", params.code || "");

        console.log("[Zhihu OAuth] 换取 access_token...");
        const tokenUrl = typeof provider.token === "string" ? provider.token : (provider.token as any).url;
        const res = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("[Zhihu OAuth] 换 token 失败:", res.status, errText);
          throw new Error(`知乎 OAuth 换 token 失败: ${res.status}`);
        }

        const tokens = await res.json();
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
    // 获取用户信息
    userinfo: {
      url: "https://api.zhihu.com/me",
      async request(context) {
        const { tokens } = context;
        const res = await fetch("https://api.zhihu.com/me", {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("[Zhihu OAuth] 获取用户信息失败:", res.status, errText);
          throw new Error(`知乎 OAuth 获取用户信息失败: ${res.status}`);
        }

        return await res.json();
      },
    },
    // 映射到 next-auth User 对象
    profile(profile) {
      console.log("[Zhihu OAuth] 用户信息:", profile.name, "id:", profile.id);
      return {
        id: `zhihu_${profile.id}`, // 前缀区分知乎用户
        name: profile.name || "知乎用户",
        email: `${profile.id}@zhihu.oauth`, // 知乎不提供 email，用占位符
        image: profile.avatar_url || null,
        username: profile.url_token || profile.name,
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
    checks: ["state"],
    ...options,
  };
}
