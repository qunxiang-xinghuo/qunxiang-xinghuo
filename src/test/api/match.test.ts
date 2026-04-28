import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/match/route';
import { GET as GETMatch, DELETE as DELETEMatch } from '@/app/api/match/[matchId]/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    matchRequest: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/server/match-engine', () => ({
  findMatch: vi.fn(),
  checkMatchStatus: vi.fn(),
  cancelMatch: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Match API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/match', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/match', {
        method: 'POST',
        body: JSON.stringify({
          brainholeId: 'cl123456789012345678901234',
          identity: 'director',
        }),
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 500 for invalid brainholeId (validation error)', async () => {
      const mockSession = { user: { id: 'user1', name: 'Test' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      const request = new NextRequest('http://localhost:3000/api/match', {
        method: 'POST',
        body: JSON.stringify({
          brainholeId: 'invalid-id',
          identity: 'director',
        }),
      });
      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it('should return 500 for missing identity (validation error)', async () => {
      const mockSession = { user: { id: 'user1', name: 'Test' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      const request = new NextRequest('http://localhost:3000/api/match', {
        method: 'POST',
        body: JSON.stringify({
          brainholeId: 'cl123456789012345678901234',
        }),
      });
      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/match/[matchId]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/match/match1');
      const response = await GETMatch(request, { params: Promise.resolve({ matchId: 'match1' }) });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/match/[matchId]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/match/match1', { method: 'DELETE' });
      const response = await DELETEMatch(request, { params: Promise.resolve({ matchId: 'match1' }) });
      expect(response.status).toBe(401);
    });
  });
});
