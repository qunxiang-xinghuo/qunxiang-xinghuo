/**
 * AI 生成 API
 * 
 * 功能：自动调用知乎获取素材，使用 LLM 生成内容
 * 
 * 接口：
 * - POST /api/ai/generate - 生成场景/角色/秘密/故事润色
 * 
 * 请求参数：
 * - type: 生成类型 ('scene' | 'character' | 'secret' | 'story_polish')
 * - prompt: 生成提示
 * - useZhihuContext: 是否使用知乎上下文
 * - zhihuQuery: 知乎搜索关键词
 * - autoCollect: 是否自动采集知乎数据
 * 
 * 返回：
 * - AI 生成的内容
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// AI 生成 API - 自动调用知乎获取素材
// POST /api/ai/generate - 生成场景/角色/秘密/故事润色

interface GenerateRequest {
  type: 'scene' | 'character' | 'secret' | 'story_polish';
  prompt: string;
  useZhihuContext?: boolean;
  zhihuQuery?: string;
  autoCollect?: boolean; // 是否自动采集知乎数据
}

// 知乎 API 配置
const ZHIHU_API_BASE = 'https://developer.zhihu.com/api/v1/content';
const ZHIHU_API_KEY = process.env.ZHIHU_API_KEY || '';

// 丰富的搜索关键词库
const SEARCH_KEYWORDS: Record<string, string[]> = {
  scene: [
    '机场离别', '咖啡馆相遇', '医院病房', '毕业典礼', '婚礼现场',
    '深夜办公室', '火车站台', '海边日落', '老房子', '异地恋',
    '久别重逢', '分手时刻', '告白场景', '职场面试', '家庭聚餐',
    '心理咨询室', '生日派对', '深夜食堂', '公园长椅', '地铁车厢',
  ],
  character: [
    '内向性格', '外向性格', 'INFJ人格', '讨好型人格', '回避型依恋',
    '完美主义者', '理想主义者', '孤独感', '自卑感', '童年创伤',
    '原生家庭', '职场新人', '中年危机', '全职妈妈', '创业者',
    '艺术家', '程序员', '医生', '教师', '心理咨询师',
  ],
  emotion: [
    '暗恋心事', '初恋回忆', '失恋痛苦', '亲情缺失', '友情背叛',
    '职场委屈', '身份认同', '死亡恐惧', '成长烦恼', '遗憾',
    '嫉妒', '感恩', '思念', '愧疚', '期待',
  ],
  story: [
    '真实经历', '感人故事', '治愈故事', '励志故事', '逆袭故事',
    '爱情故事', '亲情故事', '职场故事', '创业故事', '青春故事',
    '秘密', '谎言', '选择', '相遇', '离别',
  ],
};

// 调用知乎搜索 API
async function callZhihuSearch(query: string): Promise<Array<Record<string, unknown>>> {
  if (!ZHIHU_API_KEY) return [];
  
  try {
    const url = new URL(`${ZHIHU_API_BASE}/zhihu_search`);
    url.searchParams.append('Query', query);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ZHIHU_API_KEY}`,
        'X-Request-Timestamp': Math.floor(Date.now() / 1000).toString(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data || data.results || [];
  } catch {
    return [];
  }
}

// 从知乎获取实时素材
async function getZhihuRealtimeContext(type: string, query?: string): Promise<string> {
  try {
    // 映射类型
    const typeMap: Record<string, string> = {
      'scene': 'scene',
      'character': 'character',
      'secret': 'emotion',
      'story_polish': 'story',
    };
    
    const zhihuType = typeMap[type] || 'scene';
    const keywords = SEARCH_KEYWORDS[zhihuType] || [];
    
    // 选择搜索关键词
    let searchQuery = query;
    if (!searchQuery) {
      // 随机选择2-3个关键词组合
      const randomKeywords = keywords.sort(() => Math.random() - 0.5).slice(0, 2);
      searchQuery = randomKeywords.join(' ');
    }
    
    console.log(`[AI生成] 调用知乎搜索: "${searchQuery}"`);
    
    // 调用知乎 API
    const items = await callZhihuSearch(searchQuery);
    
    if (items.length === 0) {
      // 如果第一次搜索没有结果，尝试其他关键词
      const fallbackQuery = keywords[Math.floor(Math.random() * keywords.length)];
      console.log(`[AI生成] 备用搜索: "${fallbackQuery}"`);
      const fallbackItems = await callZhihuSearch(fallbackQuery);
      items.push(...fallbackItems);
    }
    
    // 保存到数据库（异步，不阻塞）
    for (const item of items.slice(0, 5)) {
      const content = (item.excerpt || item.content || item.description || '') as string;
      const title = (item.title || '无标题') as string;
      
      prisma.zhihuContent.create({
        data: {
          type: zhihuType,
          query: searchQuery,
          title: title,
          content: content,
          summary: content.slice(0, 300),
          sourceUrl: (item.url || '') as string,
          tags: JSON.stringify([zhihuType, searchQuery]),
        },
      }).catch(() => {}); // 忽略保存错误
    }
    
    // 构建上下文
    if (items.length === 0) return '';
    
    return items
      .slice(0, 5)
      .map((item, i) => {
        const title = item.title || '无标题';
        const excerpt = item.excerpt || item.content || item.description || '';
        return `[知乎素材${i + 1}] ${title}\n${excerpt}`;
      })
      .join('\n\n');
      
  } catch (error) {
    console.error('Get zhihu realtime context error:', error);
    return '';
  }
}

// 从数据库获取知乎数据作为上下文（备用）
async function getZhihuContext(type: string, query?: string): Promise<{ context: string; needCollect: boolean }> {
  try {
    const typeMap: Record<string, string> = {
      'scene': 'scene',
      'character': 'character',
      'secret': 'emotion',
      'story_polish': 'story',
    };
    
    const zhihuType = typeMap[type] || 'scene';
    
    const where: Record<string, unknown> = { type: zhihuType };
    if (query) {
      where.OR = [
        { query: { contains: query } },
        { title: { contains: query } },
        { tags: { contains: query } },
      ];
    }
    
    const contents = await prisma.zhihuContent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    const needCollect = contents.length < 3;
    
    if (contents.length === 0) {
      return { context: '', needCollect: true };
    }
    
    const context = contents
      .map((c: { title: string; summary: string }, i: number) => `[数据库素材${i + 1}] ${c.title}\n${c.summary}`)
      .join('\n\n');
    
    return { context, needCollect };
  } catch (error) {
    console.error('Get zhihu context error:', error);
    return { context: '', needCollect: true };
  }
}

// 构建生成提示词
function buildPrompt(type: string, userPrompt: string, zhihuContext: string): string {
  const basePrompts: Record<string, string> = {
    scene: `你是一个专业的剧本场景设计师。根据用户需求和参考素材，创建一个详细的角色扮演场景。
场景需要包含：
1. 具体地点和环境描述
2. 时间背景
3. 氛围营造
4. 两个角色的初始状态和关系
5. 可以引发对话的契机或冲突

要求：细腻、真实、有张力，能引发深层情感交流。`,

    character: `你是一个专业的角色设计师。根据用户需求和参考素材，创建一个立体的角色。
角色需要包含：
1. 基本信息（姓名、年龄、职业）
2. 性格特点（至少3个）
3. 背景故事（100字以内）
4. 在这个场景中的目的
5. 隐藏的秘密或内心独白

要求：真实、有深度、能引发共鸣。`,

    secret: `你是一个专业的心理剧编剧。根据用户需求和参考素材，为角色设计一个深层的秘密或内心独白。
秘密需要：
1. 与场景和角色关系紧密相关
2. 能引发情感张力
3. 有揭示的时机和方式
4. 能推动剧情发展

要求：细腻、真实、有冲击力。`,

    story_polish: `你是一个专业的文学编辑。根据用户提供的故事内容和参考素材，进行润色和优化。
润色方向：
1. 增强情感表达
2. 优化对话节奏
3. 丰富场景描写
4. 深化主题内涵
5. 保持原有情节不变

要求：文笔优美、情感真挚、有文学质感。`,
  };

  let prompt = basePrompts[type] || basePrompts.scene;
  
  if (zhihuContext) {
    prompt += `\n\n参考素材（来自知乎真实内容）：\n${zhihuContext}\n\n请结合以上素材，`;
  } else {
    prompt += '\n\n';
  }
  
  prompt += `用户的具体需求：${userPrompt}`;
  
  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { type, prompt, useZhihuContext = true, zhihuQuery, autoCollect = true } = body;
    
    if (!type || !prompt) {
      return NextResponse.json(
        { error: 'Missing type or prompt' },
        { status: 400 }
      );
    }
    
    const validTypes = ['scene', 'character', 'secret', 'story_polish'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: scene, character, secret, story_polish' },
        { status: 400 }
      );
    }
    
    // 获取知乎上下文 - 优先实时获取，充分利用配额
    let zhihuContext = '';
    let source = 'none';
    
    if (useZhihuContext) {
      // 优先调用知乎 API 获取实时数据
      if (autoCollect && ZHIHU_API_KEY) {
        zhihuContext = await getZhihuRealtimeContext(type, zhihuQuery || prompt.slice(0, 50));
        if (zhihuContext) {
          source = 'zhihu_realtime';
        }
      }
      
      // 如果实时获取失败，从数据库获取
      if (!zhihuContext) {
        const result = await getZhihuContext(type, zhihuQuery || prompt.slice(0, 50));
        zhihuContext = result.context;
        source = result.context ? 'database' : 'none';
      }
    }
    
    // 构建完整提示词
    const fullPrompt = buildPrompt(type, prompt, zhihuContext);
    
    // 调用 LLM
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);
    
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: '你是群像·星火创作平台的AI助手，擅长创作有深度、有张力的角色扮演内容。' },
      { role: 'user', content: fullPrompt },
    ];
    
    // 使用非流式输出
    let result = '';
    const stream = client.stream(messages, {
      model: 'doubao-seed-2-0-mini-260215',
      temperature: 0.8,
    });
    
    for await (const chunk of stream) {
      if (chunk.content) {
        result += chunk.content.toString();
      }
    }
    
    // 记录生成历史
    try {
      await prisma.aIGeneration.create({
        data: {
          type,
          prompt,
          result,
          context: zhihuContext || null,
        },
      });
    } catch (e) {
      console.error('Failed to save generation history:', e);
    }
    
    return NextResponse.json({
      type,
      result,
      usedZhihuContext: !!zhihuContext,
      contextSource: source, // zhihu_realtime | database | none
      contextCount: zhihuContext ? (zhihuContext.match(/\[.*?素材\d+\]/g) || []).length : 0,
    });
    
  } catch (error) {
    console.error('AI generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

// GET /api/ai/generate - 获取生成历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    
    const generations = await prisma.aIGeneration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return NextResponse.json({
      data: generations,
      total: generations.length,
    });
    
  } catch (error) {
    console.error('Get generations error:', error);
    return NextResponse.json(
      { error: 'Failed to get generations' },
      { status: 500 }
    );
  }
}
