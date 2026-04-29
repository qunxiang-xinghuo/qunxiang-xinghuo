import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/brainholes/collected/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    brainholeCollection: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Collected Brainholes API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/brainholes/collected');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('should return collected brainholes with pagination', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(db.brainholeCollection.findMany).mockResolvedValue([
      {
        brainhole: {
          id: 'bh_1', title: '收藏1', scenario: '内容1',
          tags: [{ tag: { id: 't1', name: 'test' } }],
          author: { id: 'u1', name: 'Author', image: null },
        },
        createdAt: new Date(),
      },
    ] as any);
    vi.mocked(db.brainholeCollection.count).mockResolvedValue(1);

    const request = new NextRequest('http://localhost:3000/api/brainholes/collected?page=1&limit=10');
    const response = await GET(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].title).toBe('收藏1');
    expect(json.data.total).toBe(1);
    expect(json.data.hasNext).toBe(false);
  });

  it('should handle database errors', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(db.brainholeCollection.findMany).mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/brainholes/collected');
    const response = await GET(request);
    expect(response.status).toBe(500);
  });
});
