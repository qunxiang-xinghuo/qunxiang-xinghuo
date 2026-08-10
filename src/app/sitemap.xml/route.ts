/**
 * @file Sitemap 生成器
 * @description 动态生成 sitemap.xml，帮助搜索引擎收录网站页面
 * 包含所有静态页面和动态内容页面（场景、故事）
 */

import { NextResponse } from 'next/server';
import { scenes, stories } from '@/lib/data';

/**
 * 网站基础域名
 */
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.qunxiangxinghuo.cn';

/**
 * 生成 sitemap.xml
 * GET /sitemap.xml
 */
export async function GET() {
  // 获取所有场景和故事
  const allScenes = scenes;
  const allStories = stories;

  // 构建 URL 列表
  const urls = [
    // 静态页面
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/scenes', priority: '0.9', changefreq: 'weekly' },
    { url: '/stories', priority: '0.9', changefreq: 'weekly' },
    { url: '/seeds', priority: '0.7', changefreq: 'monthly' },
    { url: '/workshop', priority: '0.6', changefreq: 'monthly' },
    { url: '/zhihu', priority: '0.5', changefreq: 'monthly' },
    { url: '/login', priority: '0.3', changefreq: 'monthly' },
    { url: '/register', priority: '0.3', changefreq: 'monthly' },

    // 场景详情页
    ...scenes.map((scene: { id: string }) => ({
      url: `/scenes/${scene.id}`,
      priority: '0.8',
      changefreq: 'weekly',
    })),

    // 故事详情页
    ...stories.map((story: { id: string }) => ({
      url: `/stories/${story.id}`,
      priority: '0.8',
      changefreq: 'weekly',
    })),
  ];

  // 生成 XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (item) => `  <url>
    <loc>${BASE_URL}${item.url}</loc>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
