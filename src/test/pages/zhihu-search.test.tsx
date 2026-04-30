import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Search: () => null,
  Flame: () => null,
  Globe: () => null,
  ArrowLeft: () => null,
  ExternalLink: () => null,
}));

vi.mock('framer-motion', () => ({
  motion: { div: vi.fn(({ children }) => children) },
  AnimatePresence: vi.fn(({ children }) => children),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/zhihu-search',
}));

const mockSearchResponse = {
  success: true,
  data: {
    items: [{
      Title: '测试文章',
      ContentType: 'Answer',
      ContentID: '123',
      ContentText: '这是一篇测试文章的内容摘要',
      Url: 'https://zhihu.com/question/123/answer/456',
      CommentCount: 10,
      VoteUpCount: 50,
      AuthorName: '测试用户',
      AuthorAvatar: '',
      AuthorBadge: '',
      AuthorBadgeText: '',
      EditTime: 1740470400,
      CommentInfoList: [],
      AuthorityLevel: '2',
      RankingScore: 8.5,
    }],
    hasMore: false,
    searchHashId: 'hash123',
  },
};

const mockHotListResponse = {
  success: true,
  data: {
    items: [
      { Title: '热榜第1条', Url: 'https://zhihu.com/hot/1', ThumbnailUrl: '', Summary: '摘要1' },
      { Title: '热榜第2条', Url: 'https://zhihu.com/hot/2', ThumbnailUrl: 'https://example.com/thumb.jpg', Summary: '摘要2' },
    ],
    total: 2,
  },
};

describe('知乎搜索页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe('UI 渲染', () => {
    it('应显示页面标题', async () => {
      const { default: ZhihuSearchPage } = await import('@/app/zhihu-search/page');
      render(<ZhihuSearchPage />);
      expect(screen.getByText('知乎搜索')).toBeInTheDocument();
    });

    it('应显示三个标签页', async () => {
      const { default: ZhihuSearchPage } = await import('@/app/zhihu-search/page');
      render(<ZhihuSearchPage />);
      expect(screen.getByText('站内搜索')).toBeInTheDocument();
      expect(screen.getByText('全网搜索')).toBeInTheDocument();
      expect(screen.getByText('热榜')).toBeInTheDocument();
    });

    it('应显示搜索输入框', async () => {
      const { default: ZhihuSearchPage } = await import('@/app/zhihu-search/page');
      render(<ZhihuSearchPage />);
      expect(screen.getByPlaceholderText(/搜索/)).toBeInTheDocument();
    });
  });

  describe('站内搜索', () => {
    it('搜索结果应显示文章标题', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      } as unknown as Response);

      const { default: ZhihuSearchPage } = await import('@/app/zhihu-search/page');
      render(<ZhihuSearchPage />);

      const input = screen.getByPlaceholderText(/搜索/);
      fireEvent.change(input, { target: { value: '测试' } });

      fireEvent.click(screen.getByText('搜索'));

      await waitFor(() => {
        expect(screen.getByText('测试文章')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('全网搜索', () => {
    it('全网搜索应显示结果', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      } as unknown as Response);

      const { default: ZhihuSearchPage } = await import('@/app/zhihu-search/page');
      render(<ZhihuSearchPage />);

      fireEvent.click(screen.getByText('全网搜索'));

      const input = screen.getByPlaceholderText(/搜索/);
      fireEvent.change(input, { target: { value: 'AI大模型' } });

      fireEvent.click(screen.getByText('搜索'));

      await waitFor(() => {
        expect(screen.getByText('测试文章')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('热榜', () => {
    it('热榜应显示条目标题', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHotListResponse,
      } as unknown as Response);

      const { default: ZhihuSearchPage } = await import('@/app/zhihu-search/page');
      render(<ZhihuSearchPage />);

      fireEvent.click(screen.getByText('热榜'));

      await waitFor(() => {
        expect(screen.getByText('热榜第1条')).toBeInTheDocument();
        expect(screen.getByText('热榜第2条')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});
