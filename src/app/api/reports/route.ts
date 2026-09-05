/**
 * @file 举报 API 路由
 * @description 用户举报内容提交 + 管理员举报列表查询
 *
 * 接口：
 * - POST /api/reports - 创建举报（公开，限流）
 * - GET /api/reports - 获取举报列表（仅管理员，需要 ADMIN_EMAIL）
 *
 * 安全措施：
 * - POST 严格限流（防滥用）
 * - GET 需要管理员权限（通过邮箱白名单验证）
 * - 输入验证（Zod）
 * - 敏感字段长度限制
 * - 审计日志
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { writeAuditLog, AuditLevel } from '@/lib/audit-log';
import { sanitizeInput } from '@/lib/validation';

/**
 * 管理员邮箱白名单
 * 生产环境通过环境变量 ADMIN_EMAILS 配置（逗号分隔）
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);

/**
 * 举报提交验证 Schema
 */
const createReportSchema = z.object({
  targetType: z.enum(['story', 'room', 'message']),
  targetId: z.string().min(1, '举报目标 ID 不能为空').max(100),
  reason: z.enum(['porn', 'violence', 'harassment', 'spam', 'infringement', 'other']),
  description: z
    .string()
    .max(1000, '描述不能超过 1000 字符')
    .transform((val) => sanitizeInput(val))
    .optional(),
  reporterEmail: z
    .string()
    .email('邮箱格式不正确')
    .max(254)
    .optional(),
});

// ============================================
// POST /api/reports - 创建举报
// ============================================
async function handleCreateReport(request: NextRequest) {
  try {
    const body = await request.json();
    const reporterIp = getClientIP(request.headers);

    // 输入验证
    const validation = createReportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { targetType, targetId, reason, description, reporterEmail } = validation.data;

    // 创建举报记录（不返回完整记录给前端，避免泄露内部字段）
    await prisma.report.create({
      data: {
        targetType,
        targetId,
        reason,
        description: description || null,
        reporterEmail: reporterEmail || null,
        reporterIp,
        status: 'pending',
      },
    });

    // 记录审计日志
    writeAuditLog({
      timestamp: new Date().toISOString(),
      level: AuditLevel.INFO,
      action: 'REPORT_SUBMITTED',
      ip: reporterIp,
      details: { targetType, targetId, reason },
      success: true,
    });

    return NextResponse.json({
      success: true,
      message: '举报已提交，我们会尽快处理',
    });
  } catch (error) {
    console.error('创建举报失败:', error);
    return NextResponse.json(
      { error: '举报提交失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(
  handleCreateReport,
  RATE_LIMITS.strict, // 严格限流：1 分钟 5 次
  (req) => getClientIP(req.headers)
);

// ============================================
// GET /api/reports - 获取举报列表（仅管理员）
// ============================================
export async function GET(request: NextRequest) {
  try {
    // 1. 验证登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 2. 验证管理员权限
    const userEmail = session.user.email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    if (!isAdmin) {
      // 记录未授权访问尝试
      writeAuditLog({
        timestamp: new Date().toISOString(),
        level: AuditLevel.WARNING,
        action: 'ADMIN_ACCESS_DENIED',
        userId: session.user.id,
        ip: getClientIP(request.headers),
        details: { resource: 'reports', email: userEmail },
        success: false,
        error: '非管理员尝试访问举报列表',
      });

      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    // 3. 分页参数验证
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const limit = Math.min(100, Math.max(1, limitParam)); // 限制 1-100

    const skip = (page - 1) * limit;

    // 4. 查询举报列表
    const reports = await prisma.report.findMany({
      where: {
        status: status === 'all' ? undefined : status,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await prisma.report.count({
      where: {
        status: status === 'all' ? undefined : status,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取举报列表失败:', error);
    return NextResponse.json(
      { error: '获取举报列表失败' },
      { status: 500 }
    );
  }
}
