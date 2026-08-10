/**
 * 举报 API 路由
 * POST /api/reports - 创建举报
 * GET /api/reports - 获取举报列表（管理员）
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// POST /api/reports - 创建举报
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, targetId, reason, description, reporterEmail } = body;

    // 参数验证
    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证举报类型
    const validTargetTypes = ['story', 'room', 'message'];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: '无效的举报类型' },
        { status: 400 }
      );
    }

    // 验证举报原因
    const validReasons = ['porn', 'violence', 'harassment', 'spam', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: '无效的举报原因' },
        { status: 400 }
      );
    }

    // 获取客户端 IP（用于防滥用）
    const reporterIp = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';

    // 创建举报记录
    const report = await prisma.report.create({
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

    return NextResponse.json({
      success: true,
      data: report,
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

// ============================================
// GET /api/reports - 获取举报列表（管理员）
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 计算分页
    const skip = (page - 1) * limit;

    // 查询举报列表
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

    // 获取总数
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
