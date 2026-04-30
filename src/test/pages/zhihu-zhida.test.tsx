import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Send: () => null,
  Loader2: () => null,
  Sparkles: () => null,
  ArrowLeft: () => null,
  Zap: () => null,
  Brain: () => null,
}));

vi.mock('framer-motion', () => ({
  motion: { div: vi.fn(({ children }) => children) },
  AnimatePresence: vi.fn(({ children }) => children),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/zhihu-zhida',
}));

const mockSuccessResponse = {
  success: true,
  data: {
    id: 'chatcmpl-test',
    model: 'zhida-thinking-1p5',
    content: 'rave文化是一种起源于英国的地下电子舞曲文化',
    reasoningContent: '分析rave文化的起源、发展和影响',
    finishReason: 'stop',
  },
};

describe('知乎直答页面', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('UI 渲染', () => {
    it('应显示页面标题', async () => {
      const { default: ZhihuZhidaPage } = await import('@/app/zhihu-zhida/page');
      render(<ZhihuZhidaPage />);
      expect(screen.getByText('知乎直答')).toBeInTheDocument();
    });

    it('应显示模型选择器', async () => {
      const { default: ZhihuZhidaPage } = await import('@/app/zhihu-zhida/page');
      render(<ZhihuZhidaPage />);
      expect(screen.getByText('快速回答')).toBeInTheDocument();
      expect(screen.getByText('深度思考')).toBeInTheDocument();
    });

    it('应显示输入框', async () => {
      const { default: ZhihuZhidaPage } = await import('@/app/zhihu-zhida/page');
      render(<ZhihuZhidaPage />);
      expect(screen.getByPlaceholderText(/输入问题/)).toBeInTheDocument();
    });
  });

  describe('模型选择', () => {
    it('应能切换到快速模式', async () => {
      const { default: ZhihuZhidaPage } = await import('@/app/zhihu-zhida/page');
      render(<ZhihuZhidaPage />);
      fireEvent.click(screen.getByText('快速回答'));
    });

    it('应能切换到深度思考模式', async () => {
      const { default: ZhihuZhidaPage } = await import('@/app/zhihu-zhida/page');
      render(<ZhihuZhidaPage />);
      fireEvent.click(screen.getByText('深度思考'));
    });
  });

  describe('API 调用', () => {
    it('发送问题时应调用 POST /api/zhihu/zhida', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: () => Promise.resolve(mockSuccessResponse),
      } as Response);

      const { default: ZhihuZhidaPage } = await import('@/app/zhihu-zhida/page');
      render(<ZhihuZhidaPage />);

      const input = screen.getByPlaceholderText(/输入问题/);
      fireEvent.change(input, { target: { value: '什么是量子计算' } });

      const sendBtn = screen.getByRole('button', { name: /发送/i });
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/zhihu/zhida',
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('加载中应显示加载状态', async () => {
      vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}) as Promise<Response>);

      const { default: ZhihuZhidaPage } = await import('@/app/zhihu-zhida/page');
      render(<ZhihuZhidaPage />);

      const input = screen.getByPlaceholderText(/输入问题/);
      fireEvent.change(input, { target: { value: '测试' } });

      fireEvent.click(screen.getByRole('button', { name: /发送/i }));

      await waitFor(() => {
        const loader = screen.queryByText(/思考中/);
        expect(loader).toBeInTheDocument();
      });
    });

    it('成功响应应显示回答内容', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: () => Promise.resolve(mockSuccessResponse),
      } as Response);

      const { default: ZhihuZhidaPage } = await import('@/app/zhihu-zhida/page');
      render(<ZhihuZhidaPage />);

      const input = screen.getByPlaceholderText(/输入问题/);
      fireEvent.change(input, { target: { value: '什么是rave文化' } });

      fireEvent.click(screen.getByRole('button', { name: /发送/i }));

      await waitFor(() => {
        expect(screen.getByText(/rave文化/)).toBeInTheDocument();
      });
    });

    it('错误响应应显示错误提示', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: { code: 'SERVER_ERROR', message: '服务暂时不可用' } }),
      } as Response);

      const { default: ZhihuZhidaPage } = await import('@/app/zhihu-zhida/page');
      render(<ZhihuZhidaPage />);

      const input = screen.getByPlaceholderText(/输入问题/);
      fireEvent.change(input, { target: { value: '测试' } });

      fireEvent.click(screen.getByRole('button', { name: /发送/i }));

      await waitFor(() => {
        expect(screen.getByText(/服务暂时不可用/)).toBeInTheDocument();
      });
    });
  });
});