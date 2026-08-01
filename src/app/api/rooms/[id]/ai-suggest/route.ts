/**
 * ============================================
 * AI 续写建议 API - 豆包大模型集成
 * ============================================
 * 
 * 功能说明：
 * - POST /api/rooms/[id]/ai-suggest - 获取 AI 续写建议
 * - POST /api/rooms/[id]/ai-analyze - 获取故事分析
 * 
 * AI 续写建议（POST /ai-suggest）：
 * - 基于最近 3 轮对话生成 3 个续写建议
 * - 风格：温情 / 冲突 / 留白
 * - 每个建议 50 字以内
 * 
 * 故事分析（POST /ai-analyze）：
 * - 金句：最打动人的一句话
 * - 余韵：故事结束后的感觉
 * - 秘密：隐藏的潜台词
 * - 反转：情节转折
 * 
 * 依赖配置：
 * - DOUBAO_API_KEY: 豆包 API 密钥
 * - DOUBAO_MODEL: 模型名称 (默认: doubao-seed-2-0-mini-260215)
 * 
 * 返回数据（续写）：
 * - suggestions: Array<{ style: string, content: string }>
 * 
 * 返回数据（分析）：
 * - goldenQuote: string
 * - lingeringMood: string
 * - secret: string
 * - plotTwist: string
 * 
 * @example
 * POST /api/rooms/Y0SFWF/ai-suggest { "role": "B", "style": "温情" }
 * POST /api/rooms/Y0SFWF/ai-analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';

// 生成续写建议的提示词
function generateSuggestionPrompt(
  scene: string,
  roleAName: string,
  roleBName: string,
  messages: any[]
): string {
  const recentMessages = messages.slice(-6); // 最近 3 轮
  const conversationHistory = recentMessages
    .map(msg => `${msg.role === 'A' ? roleAName : roleBName}: "${msg.content}"`)
    .join('\n');

  return `你是一位文学编辑，擅长对话体小说。基于以下场景和已有对话，给出 3 个不同的续写建议（每个建议 50 字以内），风格分别是：a) 温情 b) 冲突 c) 留白

【场景】
${scene}

【角色】
${roleAName}: 角色 A
${roleBName}: 角色 B

【已有对话】（最近 3 轮）
${conversationHistory}

【输出要求】
1. 每个建议 50 字以内
2. 风格明确标注
3. 符合角色性格和场景氛围
4. 能推动剧情发展

【输出格式】
{
  "suggestions": [
    { "style": "温情", "content": "..." },
    { "style": "冲突", "content": "..." },
    { "style": "留白", "content": "..." }
  ]
}`;
}

// 生成故事分析的提示词
function generateAnalysisPrompt(
  scene: string,
  roleAName: string,
  roleBName: string,
  messages: any[]
): string {
  const fullConversation = messages
    .map(msg => `${msg.round}. ${msg.role === 'A' ? roleAName : roleBName}: "${msg.content}"`)
    .join('\n');

  return `请从以下对话中提取：

1. 金句（最打动人的一句话，原句引用）
2. 余韵（故事结束后留下的感觉，20 字以内）
3. 秘密（对话中隐藏的潜台词，30 字以内）
4. 反转（情节转折，30 字以内）

【对话内容】
${fullConversation}

【场景】
${scene}

【角色】
${roleAName}: 角色 A
${roleBName}: 角色 B

【输出格式】
{
  "goldenQuote": "...",
  "lingeringMood": "...",
  "secret": "...",
  "plotTwist": "..."
}`;
}

// AI 续写建议 API
async function handleAISuggest(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roomId } = await params;

    // 获取房间信息
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 });
    }

    if (room.status !== 'active') {
      return NextResponse.json({ error: '房间未激活' }, { status: 400 });
    }

    // 调用豆包大模型生成建议
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.DOUBAO_MODEL || 'doubao-seed-2-0-mini-260215',
        messages: [
          {
            role: 'user',
            content: generateSuggestionPrompt(
              room.scene,
              room.roleAName,
              room.roleBName,
              room.messages
            ),
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API 调用失败：${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    // 解析 AI 响应
    let suggestions = [];
    try {
      const parsed = JSON.parse(aiResponse);
      suggestions = parsed.suggestions || [];
    } catch {
      // 如果解析失败，返回空数组
      suggestions = [];
    }

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('AI 续写建议错误:', error);
    return NextResponse.json({ error: 'AI 续写失败' }, { status: 500 });
  }
}

// 故事分析 API
async function handleAnalyze(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roomId } = await params;

    // 获取房间信息
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 });
    }

    // 调用豆包大模型生成分析
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.DOUBAO_MODEL || 'doubao-seed-2-0-mini-260215',
        messages: [
          {
            role: 'user',
            content: generateAnalysisPrompt(
              room.scene,
              room.roleAName,
              room.roleBName,
              room.messages
            ),
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API 调用失败：${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    // 解析 AI 响应
    let analysis = {};
    try {
      analysis = JSON.parse(aiResponse);
    } catch {
      analysis = {
        goldenQuote: '暂无',
        lingeringMood: '暂无',
        secret: '暂无',
        plotTwist: '暂无',
      };
    }

    // 保存分析结果
    await prisma.story.upsert({
      where: { roomId },
      update: { analysis: analysis as any },
      create: {
        roomId,
        title: `${room.scene}：${room.roleAName}与${room.roleBName}`,
        content: room.messages.map((m: any) => `${m.role === 'A' ? room.roleAName : room.roleBName}: ${m.content}`).join('\n'),
        analysis: analysis as any,
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('故事分析错误:', error);
    return NextResponse.json({ error: '故事分析失败' }, { status: 500 });
  }
}

export const GET = withRateLimit(handleAnalyze, RATE_LIMITS.standard, (req) =>
  getClientIP(req.headers)
);

export const POST = withRateLimit(handleAISuggest, RATE_LIMITS.standard, (req) =>
  getClientIP(req.headers)
);
