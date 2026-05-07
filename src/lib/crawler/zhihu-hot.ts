/**
 * 知乎热榜抓取模块
 *
 * 调用知乎公开 API 获取当日热门话题，过滤不适合转化为脑洞的内容。
 */

export interface ZhihuHotItem {
  title: string;
  excerpt: string;
  detailText: string; // 热度值，如 "123万"
  url: string;
}

const FILTER_KEYWORDS = [
  '地震', '火灾', '爆炸', '死亡', '遇难', '尸体', '自杀', '谋杀',
  '强奸', '性侵', '虐待', '战争', '屠杀', '恐怖', '毒品',
  '彩票', '股票', '基金', '涨跌', '涨停', '跌停',
  '政策', '国务院', '教育部', '卫健委', '发改委',
];

/**
 * 抓取知乎热榜
 * 使用知乎公开 API（无需认证）
 */
export async function fetchZhihuHotList(limit: number = 20): Promise<ZhihuHotItem[]> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);

  try {
    // 知乎热榜 API（公开接口，无需 Cookie）
    const res = await fetch(
      'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      console.error('[Crawler] 知乎热榜 API 返回非 2xx:', res.status);
      return [];
    }

    const data = await res.json();
    const list = data?.data || [];

    const items: ZhihuHotItem[] = list
      .map((item: any) => {
        const target = item?.target || {};
        return {
          title: target?.title?.trim() || '',
          excerpt: target?.excerpt?.trim() || '',
          detailText: item?.detail_text?.trim() || '',
          url: target?.url || '',
        };
      })
      .filter((item: ZhihuHotItem) => item.title.length > 0);

    return items.slice(0, limit);
  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.error('[Crawler] 知乎热榜请求超时');
    } else {
      console.error('[Crawler] 知乎热榜抓取失败:', e.message);
    }
    return [];
  } finally {
    clearTimeout(t);
  }
}

/**
 * 过滤不适合转化为脑洞的话题
 */
export function filterHotItems(items: ZhihuHotItem[]): ZhihuHotItem[] {
  return items.filter((item) => {
    const text = (item.title + ' ' + item.excerpt).toLowerCase();
    return !FILTER_KEYWORDS.some((kw) => text.includes(kw));
  });
}
