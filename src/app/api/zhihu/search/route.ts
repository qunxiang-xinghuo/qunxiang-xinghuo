import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { validateInput, zhihuSearchSchema, validationErrorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// Zhihu API configuration
const ZHIHU_API_BASE = 'https://developer.zhihu.com/api/v1/content';
const ZHIHU_API_KEY = process.env.ZHIHU_API_KEY || '';

interface ZhihuSearchResult {
  id: string;
  type: string;
  title: string;
  excerpt: string;
  url: string;
  author?: {
    name: string;
    avatar: string;
  };
  created_time?: number;
  answer_count?: number;
  follower_count?: number;
}

interface ZhihuHotItem {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  hot_score: number;
  image_url?: string;
}

// Helper function to generate Zhihu API headers
function getZhihuHeaders() {
  return {
    'Authorization': `Bearer ${ZHIHU_API_KEY}`,
    'X-Request-Timestamp': Math.floor(Date.now() / 1000).toString(),
    'Content-Type': 'application/json',
  };
}

async function handleZhihuSearch(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'zhihu_search'; // zhihu_search, global_search, hot_list

    if (!ZHIHU_API_KEY) {
      return NextResponse.json(
        { error: 'Zhihu API not configured. Please set ZHIHU_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    if (!query && type !== 'hot_list') {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    // 输入验证（仅对搜索词验证）
    if (query) {
      const validation = validateInput(zhihuSearchSchema, { query });
      if (!validation.success) {
        return validationErrorResponse(validation.error);
      }
    }

    let endpoint = '';
    let params: Record<string, string> = {};

    switch (type) {
      case 'zhihu_search':
        endpoint = `${ZHIHU_API_BASE}/zhihu_search`;
        params = { Query: query || '' };
        break;
      case 'global_search':
        endpoint = `${ZHIHU_API_BASE}/global_search`;
        params = { Query: query || '' };
        break;
      case 'hot_list':
        endpoint = `${ZHIHU_API_BASE}/hot_list`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid search type. Use: zhihu_search, global_search, or hot_list' },
          { status: 400 }
        );
    }

    // Build URL with query parameters
    const url = new URL(endpoint);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    // Call Zhihu API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getZhihuHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zhihu API error:', errorText);
      return NextResponse.json(
        { error: `Zhihu API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Zhihu search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Zhihu', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(
  handleZhihuSearch,
  RATE_LIMITS.lenient, // 宽松限制：1 分钟 100 次
  (req) => {
    const ip = getClientIP(req.headers);
    return `zhihu_search:${ip}`;
  }
);

export const POST = withRateLimit(
  handleZhihuSearch,
  RATE_LIMITS.lenient,
  (req) => {
    const ip = getClientIP(req.headers);
    return `zhihu_search:${ip}`;
  }
);
