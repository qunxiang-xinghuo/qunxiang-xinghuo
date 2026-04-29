import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/ai/story-weave/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/ai/story-weaver', () => ({
  weaveStory: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Story Weave API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/ai/story-weave', {
      method: 'POST',
      body: JSON.stringify({ sparks: [{ content: '火花1' }] }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 for missing sparks', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    const request = new NextRequest('http://localhost:3000/api/ai/story-weave', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 for empty sparks array', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    const request = new NextRequest('http://localhost:3000/api/ai/story-weave', {
      method: 'POST',
      body: JSON.stringify({ sparks: [] }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should weave story successfully', async () => {
    const { weaveStory } = await import('@/lib/ai/story-weaver');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(weaveStory).mockResolvedValue({
      title: '测试故事',
      content: '故事内容...',
      format: 'script',
      characters: ['角色A'],
      scenes: [{ description: '场景1', dialogue: [] }],
    } as any);

    const request = new NextRequest('http://localhost:3000/api/ai/story-weave', {
      method: 'POST',
      body: JSON.stringify({
        sparks: [
          { content: '急诊科医生坚持先推肾上腺素', identity: '急诊科医生' },
          { content: '导演喊咔，要求重拍', identity: '导演' },
        ],
        format: 'script',
        tone: 'dramatic',
        length: 'short',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.title).toBe('测试故事');
    expect(weaveStory).toHaveBeenCalledWith(expect.objectContaining({
      sparks: expect.any(Array),
      format: 'script',
      tone: 'dramatic',
      length: 'short',
    }));
  });

  it('should use default format and length', async () => {
    const { weaveStory } = await import('@/lib/ai/story-weaver');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(weaveStory).mockResolvedValue({ title: '默认故事', content: '内容' } as any);

    const request = new NextRequest('http://localhost:3000/api/ai/story-weave', {
      method: 'POST',
      body: JSON.stringify({ sparks: [{ content: '火花' }] }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(weaveStory).toHaveBeenCalledWith(expect.objectContaining({
      format: 'script',
      length: 'medium',
    }));
  });
});
