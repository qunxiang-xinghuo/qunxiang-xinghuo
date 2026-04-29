import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/users/identities/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    userIdentity: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('User Identities API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/users/identities', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/users/identities');
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('should return identities successfully', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.userIdentity.findMany).mockResolvedValue([
        { id: 'id1', userId: 'user1', label: '导演', verified: false },
        { id: 'id2', userId: 'user1', label: '演员', verified: true },
      ] as any);

      const request = new NextRequest('http://localhost:3000/api/users/identities');
      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(2);
      expect(json.data[0].label).toBe('导演');
    });

    it('should handle database errors', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.userIdentity.findMany).mockRejectedValue(new Error('DB error'));

      const request = new NextRequest('http://localhost:3000/api/users/identities');
      const response = await GET(request);
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/users/identities', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/users/identities', {
        method: 'POST',
        body: JSON.stringify({ label: '导演' }),
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 for empty label', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      const request = new NextRequest('http://localhost:3000/api/users/identities', {
        method: 'POST',
        body: JSON.stringify({ label: '' }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 when identity already exists', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.userIdentity.findFirst).mockResolvedValue({
        id: 'id1', userId: 'user1', label: '导演', verified: false,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/users/identities', {
        method: 'POST',
        body: JSON.stringify({ label: '导演' }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe('IDENTITY_ALREADY_EXISTS');
    });

    it('should create identity successfully', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.userIdentity.findFirst).mockResolvedValue(null);
      vi.mocked(db.userIdentity.create).mockResolvedValue({
        id: 'id_new', userId: 'user1', label: '编剧', verified: false,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/users/identities', {
        method: 'POST',
        body: JSON.stringify({ label: '编剧' }),
      });
      const response = await POST(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.label).toBe('编剧');
    });
  });
});
