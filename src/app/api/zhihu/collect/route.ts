/**
 * 知乎素材采集 API
 * 
 * 功能：采集知乎平台上的素材内容
 * 
 * 接口：
 * - POST /api/zhihu/collect - 采集知乎素材
 * 
 * 请求参数：
 * - query: 搜索关键词
 * - limit: 返回数量限制
 * 
 * 返回：
 * - 成功：采集到的素材列表
 * - 失败：错误信息
 * 
 * 注意：
 * - 需要配置 ZHIHU_API_KEY 环境变量
 * - 受速率限制保护
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// 知乎 API 配置
const ZHIHU_API_BASE = 'https://developer.zhihu.com/api/v1/content';
const ZHIHU_API_KEY = process.env.ZHIHU_API_KEY || '';

// 丰富的搜索关键词库 - 充分利用配额
const SEARCH_KEYWORDS = {
  // 场景类关键词（50+）
  scene: [
    '机场离别', '咖啡馆相遇', '医院病房', '毕业典礼', '婚礼现场',
    '深夜办公室', '火车站台', '海边日落', '老房子', '童年老家',
    '异地恋', '久别重逢', '分手时刻', '告白场景', '道歉时刻',
    '职场面试', '创业失败', '考试失利', '搬家告别', '留学机场',
    '家庭聚餐', '朋友聚会', '同学会', '相亲现场', '约会餐厅',
    '心理咨询室', '律师办公室', '警察局', '法庭', '谈判桌',
    '生日派对', '纪念日', '情人节', '母亲节', '父亲节',
    '清明节扫墓', '中秋节团圆', '春节回家', '国庆旅行', '跨年倒计时',
    '深夜食堂', '便利店', '书店', '电影院', '游乐场',
    '公园长椅', '地铁车厢', '公交车站', '出租车后座', '飞机客舱',
  ],
  
  // 角色类关键词（50+）
  character: [
    '内向性格', '外向性格', 'INFJ人格', 'INTJ人格', 'ENFP人格',
    '讨好型人格', '回避型依恋', '焦虑型依恋', '安全型依恋', '回避型人格',
    '完美主义者', '理想主义者', '现实主义', '浪漫主义', '悲观主义',
    '乐观主义', '孤独感', '自卑感', '优越感', '使命感',
    '童年创伤', '原生家庭', '单亲家庭', '留守儿童', '二胎家庭',
    '职场新人', '中年危机', '退休生活', '全职妈妈', '职场妈妈',
    '创业者', '艺术家', '程序员', '医生', '教师',
    '律师', '心理咨询师', '记者', '作家', '音乐人',
    '摄影师', '设计师', '产品经理', '运营人员', '销售人员',
    '大学生', '研究生', '留学生', '交换生', '毕业生',
  ],
  
  // 情感类关键词（50+）
  emotion: [
    '暗恋心事', '初恋回忆', '失恋痛苦', '复合纠结', '单相思',
    '亲情缺失', '父爱沉默', '母爱唠叨', '兄弟姐妹', '祖孙情',
    '友情背叛', '闺蜜心事', '兄弟情义', '知己难寻', '社交恐惧',
    '职场委屈', '同事矛盾', '上下级关系', '职场霸凌', '办公室政治',
    '身份认同', '性别困惑', '性取向', '自我怀疑', '自我接纳',
    '死亡恐惧', '失去亲人', '宠物离世', '疾病折磨', '康复历程',
    '成长烦恼', '青春期', '叛逆期', '中年焦虑', '老年孤独',
    '遗憾', '后悔', '原谅', '释怀', '放下',
    '嫉妒', '羡慕', '攀比', '虚荣', '自卑',
    '感恩', '愧疚', '羞耻', '骄傲', '自豪',
    '思念', '牵挂', '担心', '害怕', '期待',
  ],
  
  // 故事类关键词（50+）
  story: [
    '真实经历', '亲身经历', '身边故事', '朋友故事', '家人故事',
    '感人故事', '催泪故事', '温暖故事', '治愈故事', '励志故事',
    '逆袭故事', '重生故事', '成长故事', '蜕变故事', '觉醒故事',
    '爱情故事', '婚姻故事', '离婚故事', '复婚故事', '再婚故事',
    '亲情故事', '友情故事', '师生故事', '医患故事', '警民故事',
    '职场故事', '创业故事', '失败故事', '成功故事', '奋斗故事',
    '城市故事', '农村故事', '小镇故事', '故乡故事', '异乡故事',
    '青春故事', '中年故事', '老年故事', '童年故事', '少年故事',
    '秘密', '谎言', '真相', '误会', '和解',
    '选择', '放弃', '坚持', '妥协', '抗争',
    '相遇', '离别', '重逢', '错过', '等待',
  ],
};

// 获取知乎 API Headers
function getZhihuHeaders() {
  return {
    'Authorization': `Bearer ${ZHIHU_API_KEY}`,
    'X-Request-Timestamp': Math.floor(Date.now() / 1000).toString(),
    'Content-Type': 'application/json',
  };
}

// 调用知乎搜索 API
async function callZhihuSearch(query: string): Promise<unknown[]> {
  try {
    const url = new URL(`${ZHIHU_API_BASE}/zhihu_search`);
    url.searchParams.append('Query', query);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getZhihuHeaders(),
    });

    if (!response.ok) {
      console.error('Zhihu API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data || data.results || [];
  } catch (error) {
    console.error('Call zhihu search error:', error);
    return [];
  }
}

// 保存数据到数据库
async function saveToDatabase(type: string, query: string, items: unknown[]) {
  const savedItems = [];
  
  for (const item of items as Array<Record<string, unknown>>) {
    const content = (item.excerpt || item.content || item.description || '') as string;
    const title = (item.title || '无标题') as string;
    const sourceUrl = (item.url || '') as string;
    
    // 生成标签
    const tags = JSON.stringify([type, query]);

    try {
      const saved = await prisma.zhihuContent.create({
        data: {
          type: type,
          query: query,
          title: title,
          content: content,
          summary: content.slice(0, 300),
          sourceUrl: sourceUrl,
          tags: tags,
        },
      });
      savedItems.push(saved);
    } catch (e) {
      console.error('Save item error:', e);
    }
  }
  
  return savedItems;
}

// POST /api/zhihu/collect - 批量采集知乎数据
async function handleCollect(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, query, count = 10 } = body;

    if (!ZHIHU_API_KEY) {
      return NextResponse.json(
        { error: '知乎 API 未配置，请设置 ZHIHU_API_KEY 环境变量' },
        { status: 500 }
      );
    }

    // 确定要采集的类型和关键词
    const types = type ? [type] : ['scene', 'character', 'emotion', 'story'];
    const results: Record<string, { collected: number; queries: string[] }> = {};

    for (const t of types) {
      const keywords = SEARCH_KEYWORDS[t as keyof typeof SEARCH_KEYWORDS] || [];
      let collected = 0;
      const usedQueries: string[] = [];

      // 如果指定了 query，优先使用
      const queries = query ? [query] : keywords.slice(0, count);

      for (const q of queries) {
        console.log(`[知乎采集] 类型: ${t}, 搜索: "${q}"`);
        
        const items = await callZhihuSearch(q);
        
        if (items.length > 0) {
          const saved = await saveToDatabase(t, q, items);
          collected += saved.length;
          usedQueries.push(q);
          console.log(`[知乎采集] 获取 ${saved.length} 条数据`);
        }

        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      results[t] = { collected, queries: usedQueries };
    }

    // 统计总数
    const totalCollected = Object.values(results).reduce((sum, r) => sum + r.collected, 0);

    return NextResponse.json({
      success: true,
      message: `成功采集 ${totalCollected} 条知乎数据`,
      results,
      totalCollected,
    });

  } catch (error) {
    console.error('Collect zhihu content error:', error);
    return NextResponse.json(
      { error: '采集失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// GET /api/zhihu/collect - 获取采集状态和数据
async function handleGetStats(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const action = searchParams.get('action');

    // 获取统计数据
    const stats = await prisma.zhihuContent.groupBy({
      by: ['type'],
      _count: true,
    });

    // 自动采集模式
    if (action === 'auto') {
      // 检查每种类型的数据量，不足的自动采集
      const typeCounts: Record<string, number> = {};
      stats.forEach((s: { type: string; _count: number }) => {
        typeCounts[s.type] = s._count;
      });

      const needCollect: string[] = [];
      const TARGET_COUNT = 50; // 目标每种类型50条

      for (const t of ['scene', 'character', 'emotion', 'story']) {
        if ((typeCounts[t] || 0) < TARGET_COUNT) {
          needCollect.push(t);
        }
      }

      if (needCollect.length > 0) {
        // 触发后台采集
        setTimeout(async () => {
          for (const t of needCollect) {
            const keywords = SEARCH_KEYWORDS[t as keyof typeof SEARCH_KEYWORDS] || [];
            const randomKeywords = keywords.sort(() => Math.random() - 0.5).slice(0, 5);
            
            for (const q of randomKeywords) {
              const items = await callZhihuSearch(q);
              if (items.length > 0) {
                await saveToDatabase(t, q, items);
              }
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }, 0);
      }

      return NextResponse.json({
        success: true,
        message: `触发自动采集: ${needCollect.join(', ')}`,
        stats: stats.map((s: { type: string; _count: number }) => ({ type: s.type, count: s._count })),
        needCollect,
      });
    }

    // 获取指定类型的数据
    let data: Array<Record<string, unknown>> = [];
    if (type) {
      data = await prisma.zhihuContent.findMany({
        where: { type: type },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }

    return NextResponse.json({
      success: true,
      stats: stats.map((s: { type: string; _count: number }) => ({ type: s.type, count: s._count })),
      data: data,
      keywords: SEARCH_KEYWORDS,
    });

  } catch (error) {
    console.error('Get zhihu status error:', error);
    return NextResponse.json(
      { error: '获取状态失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST（调用知乎开放 API 采集）：严格限流 1 分钟 10 次/IP（外部配额成本控制）
export const POST = withRateLimit(
  handleCollect,
  RATE_LIMITS.ai,
  (req: NextRequest) => getClientIP(req.headers)
);

// GET（查询采集统计）：标准限流
export const GET = withRateLimit(
  handleGetStats,
  RATE_LIMITS.standard,
  (req: NextRequest) => getClientIP(req.headers)
);
