import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/library/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    reaction: { findMany: vi.fn(), count: vi.fn() },
    storyDraft: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Library API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/library');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('should return library data successfully', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(db.reaction.findMany).mockResolvedValue([
      { id: 'r1', content: '反应1', brainhole: { id: 'bh1', title: '脑洞1', scenario: '场景1' } },
    ] as any);
    vi.mocked(db.reaction.count).mockResolvedValue(1);
    vi.mocked(db.storyDraft.findMany).mockResolvedValue([
      { id: 'sd1', title: '草稿1', content: '内容1' },
    ] as any);
    vi.mocked(db.storyDraft.count).mockResolvedValue(1);

    const request = new NextRequest('http://localhost:3000/api/library');
    const response = await GET(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.reactions).toHaveLength(1);
    expect(json.data.sparks).toHaveLength(1);
    expect(json.data.storyDrafts).toHaveLength(1);
    expect(json.data.stats.totalReactions).toBe(1);
    expect(json.data.stats.totalSparks).toBe(1);
    expect(json.data.stats.totalStoryDrafts).toBe(1);
  });

  it('should handle database errors', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(db.reaction.findMany).mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/library');
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});
