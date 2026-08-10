/**
 * @file NextAuth 认证路由
 * @description 处理用户登录、登出、会话管理等认证相关操作
 * 
 * 路由说明：
 * - GET /api/auth/* - 处理认证相关请求
 * - POST /api/auth/* - 处理认证相关请求
 * 
 * 支持的认证方式：
 * - Credentials（用户名/密码）
 * 
 * 会话策略：JWT（无状态）
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
