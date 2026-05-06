import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * v8.0-login-fix: 服务器端登出
 * 将用户 token 标记为失效，实现真正的服务器端 Token 撤销
 */
export async function POST(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (token?.id) {
      // 更新用户的 tokenRevokedAt，使该用户所有已签发的 JWT 失效
      await db.user.update({
        where: { id: token.id as string },
        data: { tokenRevokedAt: new Date() },
      });
      console.log('[Logout] Token 服务器端已失效, userId:', token.id);
    }
    
    return NextResponse.json({ success: true, message: '已登出' });
  } catch (e) {
    console.error('[Logout] API 错误:', e);
    // 即使后端出错也返回成功，不阻塞客户端登出流程
    return NextResponse.json({ success: true, message: '已登出' });
  }
}
