import { getToken } from 'next-auth/jwt';
import { db } from './db';

/**
 * v8.0-login-fix: 检查当前请求的 Token 是否已被服务器端撤销
 * 
 * 用法：在需要保护的 API 路由中调用
 * if (await isTokenRevoked(req)) {
 *   return NextResponse.json({ success: false, error: { message: '登录已过期，请重新登录' } }, { status: 401 });
 * }
 */
export async function isTokenRevoked(req: Request): Promise<boolean> {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    
    // 没有 token = 未登录 = 视为已撤销
    if (!token?.id) return true;
    
    const user = await db.user.findUnique({
      where: { id: token.id as string },
      select: { tokenRevokedAt: true },
    });
    
    // 用户不存在 = 视为已撤销
    if (!user) return true;
    
    // 没有设置撤销时间 = 未撤销
    if (!user.tokenRevokedAt) return false;
    
    // 比较 token 签发时间 (iat, 秒) 和撤销时间
    const tokenIatMs = token.iat ? (token.iat as number) * 1000 : 0;
    const revokedAtMs = user.tokenRevokedAt.getTime();
    
    // 如果 token 签发时间早于撤销时间，说明该 token 已被撤销
    const isRevoked = tokenIatMs < revokedAtMs;
    if (isRevoked) {
      console.log('[Auth] Token 已被撤销, userId:', token.id);
    }
    return isRevoked;
  } catch (e) {
    console.error('[Auth] Token 撤销检查失败:', e);
    // 检查失败时保守处理：视为未撤销，让请求继续
    return false;
  }
}
