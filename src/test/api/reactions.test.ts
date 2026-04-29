import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/reactions/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    reaction: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    brainhole: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Reactions API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/reactions', () => {
    it('should return reactions with pagination', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.reaction.findMany).mockResolvedValue([
        { id: 'r1', content: '反应1', identity: '导演', user: { id: 'u1', name: 'Test' }, brainhole: { id: 'bh1', title: '脑洞1' } },
      ] as any);
      vi.mocked(db.reaction.count).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/reactions?page=1&limit=10');
      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.items).toHaveLength(1);
      expect(json.data.total).toBe(1);
      expect(json.data.page).toBe(1);
    });

    it('should filter by brainholeId', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.reaction.findMany).mockResolvedValue([] as any);
      vi.mocked(db.reaction.count).mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/reactions?brainholeId=cl123456789012345678901234');
      const response = await GET(request);
      expect(response.status).toBe(200);

      expect(db.reaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ brainholeId: 'cl123456789012345678901234' }),
        })
      );
    });

    it('should handle database errors', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.reaction.findMany).mockRejectedValue(new Error('DB error'));

      const request = new NextRequest('http://localhost:3000/api/reactions');
      const response = await GET(request);
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/reactions', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/reactions', {
        method: 'POST',
        body: JSON.stringify({ brainholeId: 'cl123456789012345678901234', identity: '导演', content: '精彩' }),
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 404 when brainhole not found', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.brainhole.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/reactions', {
        method: 'POST',
        body: JSON.stringify({ brainholeId: 'cl123456789012345678901234', identity: '导演', content: '精彩' }),
      });
      const response = await POST(request);
      expect(response.status).toBe(404);
    });

    it('should create reaction successfully', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.brainhole.findUnique).mockResolvedValue({ id: 'cl123456789012345678901234', title: '脑洞1' } as any);
      vi.mocked(db.reaction.create).mockResolvedValue({
        id: 'r_new', content: '精彩', identity: '导演', userId: 'user1', brainholeId: 'cl123456789012345678901234',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/reactions', {
        method: 'POST',
        body: JSON.stringify({ brainholeId: 'cl123456789012345678901234', identity: '导演', content: '精彩' }),
      });
      const response = await POST(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.content).toBe('精彩');
      expect(db.brainhole.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reactionCount: { increment: 1 } }),
        })
      );
    });
  });
});
