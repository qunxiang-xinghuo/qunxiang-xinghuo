import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generatePromptFromContext,
  refinePrompt,
  generateCatalystQuestions,
} from '@/lib/ai/prompt-generator';

describe('Prompt Generator', () => {
  const originalEnv = process.env.DEEPSEEK_API_KEY;

  beforeEach(() => {
    process.env.DEEPSEEK_API_KEY = 'sk-test-key';
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('console', { ...console, warn: vi.fn(), error: vi.fn() });
  });

  afterEach(() => {
    process.env.DEEPSEEK_API_KEY = originalEnv;
    vi.unstubAllGlobals();
  });

  describe('generatePromptFromContext', () => {
    it('should generate prompt from context via DeepSeek', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '  如果你是当事人，你会怎么选择？  ' } }],
        }),
      } as Response);

      const prompt = await generatePromptFromContext(
        '深夜急诊室，一位外卖员因过度劳累晕倒',
        'medical',
        ['医生', '急诊']
      );
      expect(prompt).toBe('如果你是当事人，你会怎么选择？');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    it('should fallback when DeepSeek API fails', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const prompt = await generatePromptFromContext('测试内容');
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should fallback when API returns non-ok status', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 402,
        statusText: 'Payment Required',
      } as Response);

      const prompt = await generatePromptFromContext('测试内容');
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe('refinePrompt', () => {
    it('should refine prompt based on feedback', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '  更具体的问题：你当时最担心的是什么？  ' } }],
        }),
      } as Response);

      const refined = await refinePrompt('你当时的感受是什么？', '太笼统了');
      expect(refined).toContain('更具体');
    });

    it('should fallback when refinement fails', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Timeout'));

      const refined = await refinePrompt('基础提示');
      expect(refined).toBe('基础提示');
    });
  });

  describe('generateCatalystQuestions', () => {
    it('should generate catalyst questions via DeepSeek', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '["问题1？", "问题2？", "问题3？"]' } }],
        }),
      } as Response);

      const questions = await generateCatalystQuestions('外卖员深夜送餐的奇遇', 3);
      expect(questions).toHaveLength(3);
      expect(questions[0]).toBe('问题1？');
    });

    it('should fallback when generation fails', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Timeout'));

      const questions = await generateCatalystQuestions('脑洞内容', 3);
      expect(questions).toHaveLength(3);
      expect(questions.every(q => typeof q === 'string' && q.length > 0)).toBe(true);
    });

    it('should handle malformed JSON from API', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'not valid json' } }],
        }),
      } as Response);

      const questions = await generateCatalystQuestions('脑洞内容', 3);
      expect(questions).toHaveLength(3);
    });
  });
});
