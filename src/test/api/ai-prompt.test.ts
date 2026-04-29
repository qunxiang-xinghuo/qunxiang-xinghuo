import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/ai/prompt/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/ai', () => ({
  getAIPrompt: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('AI Prompt API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/ai/prompt');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('should return prompt successfully', async () => {
    const { getAIPrompt } = await import('@/lib/ai');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(getAIPrompt).mockResolvedValue({
      prompt: '第一反应是什么？不要思考，直接说出来。',
      source: 'fallback',
      category: 'default',
    });

    const request = new NextRequest('http://localhost:3000/api/ai/prompt?brainholeId=bh_1&category=drama');
    const response = await GET(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.prompt).toContain('不要思考');
    expect(getAIPrompt).toHaveBeenCalledWith('bh_1', 'drama', undefined);
  });

  it('should pass tags parameter', async () => {
    const { getAIPrompt } = await import('@/lib/ai');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(getAIPrompt).mockResolvedValue({
      prompt: 'Tagged prompt',
      source: 'fallback',
      tags: ['tag1', 'tag2'],
    });

    const request = new NextRequest('http://localhost:3000/api/ai/prompt?tags=tag1,tag2');
    const response = await GET(request);
    expect(response.status).toBe(200);

    expect(getAIPrompt).toHaveBeenCalledWith(undefined, undefined, ['tag1', 'tag2']);
  });

  it('should handle AI service errors', async () => {
    const { getAIPrompt } = await import('@/lib/ai');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(getAIPrompt).mockRejectedValue(new Error('AI service error'));

    const request = new NextRequest('http://localhost:3000/api/ai/prompt');
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});
