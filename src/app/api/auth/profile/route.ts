/**
 * 用户资料 API
 * 
 * 功能：获取当前登录用户的资料信息
 * 
 * 接口：
 * - GET /api/auth/profile - 获取当前用户资料
 * 
 * 返回：
 * - 成功：用户资料（email, username, createdAt）
 * - 失败：未登录错误
 * 
 * 安全：
 * - 需要登录才能访问
 * - 只返回当前用户的信息
 */

import { authOptions } from '@/lib/auth-config';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
