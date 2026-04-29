import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the zhihu-dev-api module before importing routes
vi.mock('@/lib/zhihu-dev-api', () => ({
  zhihuSearch: vi.fn(),
  globalSearch: vi.fn(),
  getHotList: vi.fn(),
  zhidaChat: vi.fn(),
}));

// Import routes after mock
import { GET as searchGET } from '@/app/api/zhihu/search/route';
import { GET as globalSearchGET } from '@/app/api/zhihu/global-search/route';
import { GET as hotListGET } from '@/app/api/zhihu/hot-list/route';
import { POST as zhidaPOST } from '@/app/api/zhihu/zhida/route';

describe('知乎开发者平台 API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== 知乎搜索 ==========
  describe('GET /api/zhihu/search', () => {
    it('should return search results successfully', async () => {
      const { zhihuSearch } = await import('@/lib/zhihu-dev-api');
      vi.mocked(zhihuSearch).mockResolvedValue({
        Code: 0,
        Message: 'success',
        Data: {
          HasMore: false,
          SearchHashId: 'test123',
          Items: [
            {
              Title: '测试文章',
              ContentType: 'Article',
              ContentID: '123',
              ContentText: '测试内容',
              Url: 'https://zhuanlan.zhihu.com/p/123',
              CommentCount: 10,
              VoteUpCount: 50,
              AuthorName: '测试作者',
              AuthorAvatar: '',
              AuthorBadge: '',
              AuthorBadgeText: '',
              EditTime: 1710000000,
              CommentInfoList: [],
              AuthorityLevel: '2',
              RankingScore: 0.95,
            },
          ],
        },
      });

      const request = new NextRequest('http://localhost:3000/api/zhihu/search?query=rave文化&count=5');
      const response = await searchGET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(1);
      expect(json.data.items[0].Title).toBe('测试文章');
      expect(zhihuSearch).toHaveBeenCalledWith('rave文化', 5);
    });

    it('should return 400 for empty query', async () => {
      const request = new NextRequest('http://localhost:3000/api/zhihu/search?query=');
      const response = await searchGET(request);
      expect(response.status).toBe(400);
    });

    it('should handle API errors', async () => {
      const { zhihuSearch } = await import('@/lib/zhihu-dev-api');
      vi.mocked(zhihuSearch).mockRejectedValue(new Error('API Error'));

      const request = new NextRequest('http://localhost:3000/api/zhihu/search?query=test');
      const response = await searchGET(request);
      expect(response.status).toBe(500);
    });
  });

  // ========== 全网搜索 ==========
  describe('GET /api/zhihu/global-search', () => {
    it('should return global search results', async () => {
      const { globalSearch } = await import('@/lib/zhihu-dev-api');
      vi.mocked(globalSearch).mockResolvedValue({
        Code: 0,
        Message: 'success',
        Data: {
          HasMore: true,
          SearchHashId: 'global123',
          Items: [],
        },
      });

      const request = new NextRequest('http://localhost:3000/api/zhihu/global-search?query=ChatGPT');
      const response = await globalSearchGET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(globalSearch).toHaveBeenCalledWith('ChatGPT', 10);
    });
  });

  // ========== 知乎热榜 ==========
  describe('GET /api/zhihu/hot-list', () => {
    it('should return hot list successfully', async () => {
      const { getHotList } = await import('@/lib/zhihu-dev-api');
      vi.mocked(getHotList).mockResolvedValue({
        Code: 0,
        Message: 'success',
        Data: {
          Total: 2,
          Items: [
            {
              Title: '如何评价某个热点问题？',
              Url: 'https://www.zhihu.com/question/123456789',
              ThumbnailUrl: 'https://pic1.zhimg.com/test.jpg',
              Summary: '这是摘要',
            },
            {
              Title: '热榜文章标题',
              Url: 'https://zhuanlan.zhihu.com/p/987654321',
              ThumbnailUrl: '',
              Summary: '',
            },
          ],
        },
      });

      const request = new NextRequest('http://localhost:3000/api/zhihu/hot-list?limit=10');
      const response = await hotListGET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(2);
      expect(json.data.total).toBe(2);
      expect(getHotList).toHaveBeenCalledWith(10);
    });

    it('should use default limit', async () => {
      const { getHotList } = await import('@/lib/zhihu-dev-api');
      vi.mocked(getHotList).mockResolvedValue({
        Code: 0,
        Message: 'success',
        Data: { Total: 0, Items: [] },
      });

      const request = new NextRequest('http://localhost:3000/api/zhihu/hot-list');
      await hotListGET(request);
      expect(getHotList).toHaveBeenCalledWith(30);
    });
  });

  // ========== 知乎直答 ==========
  describe('POST /api/zhihu/zhida', () => {
    it('should return chat response successfully', async () => {
      const { zhidaChat } = await import('@/lib/zhihu-dev-api');
      vi.mocked(zhidaChat).mockResolvedValue({
        id: 'chatcmpl-test',
        object: 'chat.completion',
        created: 1740470400,
        model: 'zhida-thinking-1p5',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              reasoning_content: '分析过程...',
              content: '最终回答',
            },
            finish_reason: 'stop',
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/zhihu/zhida', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: '怎么理解rave文化' }],
        }),
      });
      const response = await zhidaPOST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.content).toBe('最终回答');
      expect(json.data.reasoningContent).toBe('分析过程...');
      expect(zhidaChat).toHaveBeenCalledWith(
        [{ role: 'user', content: '怎么理解rave文化' }],
        'zhida-thinking-1p5'
      );
    });

    it('should support fast model', async () => {
      const { zhidaChat } = await import('@/lib/zhihu-dev-api');
      vi.mocked(zhidaChat).mockResolvedValue({
        id: 'chatcmpl-test',
        object: 'chat.completion',
        created: 1740470400,
        model: 'zhida-fast-1p5',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: '快速回答' },
            finish_reason: 'stop',
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/zhihu/zhida', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: '你好' }],
          model: 'zhida-fast-1p5',
        }),
      });
      const response = await zhidaPOST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data.content).toBe('快速回答');
    });

    it('should return 400 for invalid body', async () => {
      const request = new NextRequest('http://localhost:3000/api/zhihu/zhida', {
        method: 'POST',
        body: JSON.stringify({ messages: [] }),
      });
      const response = await zhidaPOST(request);
      expect(response.status).toBe(400);
    });
  });
});
