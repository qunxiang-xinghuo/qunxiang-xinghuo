import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 知乎数据采集 API
// POST /api/zhihu/collect - 采集知乎数据并存储到数据库

interface ZhihuSearchResult {
  Title: string;
  Excerpt: string;
  Content: string;
  Url: string;
  Author?: {
    Name: string;
  };
  Hot?: number;
}

// 从知乎搜索结果提取有用信息
function extractContent(result: ZhihuSearchResult, type: string): { content: string; summary: string; tags: string[] } {
  const content = result.Content || result.Excerpt || '';
  
  // 简单的标签提取
  const tags: string[] = [];
  if (type === 'scene') {
    const sceneKeywords = ['机场', '车站', '咖啡馆', '医院', '学校', '办公室', '餐厅', '公园', '车站', '码头'];
    sceneKeywords.forEach(kw => {
      if (content.includes(kw)) tags.push(kw);
    });
  } else if (type === 'character') {
    const charKeywords = ['性格', '内向', '外向', '敏感', '坚强', '温柔', '冷漠', '热情'];
    charKeywords.forEach(kw => {
      if (content.includes(kw)) tags.push(kw);
    });
  } else if (type === 'emotion') {
    const emotionKeywords = ['遗憾', '后悔', '感动', '思念', '爱', '恨', '恐惧', '希望', '孤独'];
    emotionKeywords.forEach(kw => {
      if (content.includes(kw)) tags.push(kw);
    });
  }
  
  // 生成摘要（取前200字）
  const summary = content.slice(0, 200).replace(/\s+/g, ' ').trim() + '...';
  
  return { content, summary, tags };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type } = body;
    
    if (!query || !type) {
      return NextResponse.json(
        { error: 'Missing query or type' },
        { status: 400 }
      );
    }
    
    const validTypes = ['scene', 'character', 'emotion', 'story'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: scene, character, emotion, story' },
        { status: 400 }
      );
    }
    
    // 调用知乎搜索 API
    const zhihuApiKey = process.env.ZHIHU_API_KEY;
    if (!zhihuApiKey) {
      return NextResponse.json(
        { error: 'Zhihu API not configured' },
        { status: 500 }
      );
    }
    
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const searchResponse = await fetch(
      `https://api.zhihu.com/search?type=zhihu&q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${zhihuApiKey}`,
          'x-api-version': '3.0.91',
          'x-zse-93-v': '1',
          'x-zse-93': '101_3_3.0',
          'x-app-za': 'OS=web',
          'x-zse-91': timestamp,
        },
      }
    );
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      return NextResponse.json(
        { error: 'Zhihu API error', details: errorText },
        { status: searchResponse.status }
      );
    }
    
    const searchData = await searchResponse.json();
    const results: ZhihuSearchResult[] = searchData.data || [];
    
    if (results.length === 0) {
      return NextResponse.json({
        message: 'No results found',
        collected: 0,
      });
    }
    
    // 存储到数据库
    const collected = [];
    
    for (const result of results.slice(0, 10)) { // 最多存储10条
      const { content, summary, tags } = extractContent(result, type);
      
      const record = await prisma.zhihuContent.create({
        data: {
          type,
          query,
          title: result.Title || '无标题',
          content,
          summary,
          sourceUrl: result.Url || null,
          tags: JSON.stringify(tags),
        },
      });
      
      collected.push({
        id: record.id,
        title: record.title,
        summary: record.summary,
      });
    }
    
    return NextResponse.json({
      message: 'Data collected successfully',
      collected: collected.length,
      data: collected,
    });
    
  } catch (error) {
    console.error('Zhihu collect error:', error);
    return NextResponse.json(
      { error: 'Failed to collect data' },
      { status: 500 }
    );
  }
}

// GET /api/zhihu/collect - 获取已采集的知乎数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const prismaClient = prisma;
    
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (query) where.query = { contains: query };
    
    const contents = await prismaClient.zhihuContent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return NextResponse.json({
      data: contents.map((c: { tags: string }) => ({
        ...c,
        tags: JSON.parse(c.tags || '[]'),
      })),
      total: contents.length,
    });
    
  } catch (error) {
    console.error('Get zhihu content error:', error);
    return NextResponse.json(
      { error: 'Failed to get content' },
      { status: 500 }
    );
  }
}
