import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/brainholes/route';
import { GET as GETDetail } from '@/app/api/brainholes/[id]/route';
import { POST as POSTCollect } from '@/app/api/brainholes/[id]/collect/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    brainhole: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
    brainholeTag: {
      create: vi.fn(),
    },
    brainholeCollection: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Brainhole API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/brainholes', () => {
    it('should return brainholes with pagination', async () => {
      const mockBrainholes = [
        {
          id: 'brainhole1',
          title: 'Test Brainhole',
          scenario: 'Test Scenario',
          status: 'approved',
          difficulty: 'medium',
          category: 'general',
          hotScore: 50,
          recencyBoost: false,
          reactionCount: 0,
          sparkCount: 0,
          collectionCount: 0,
          contextTime: null,
          contextLocation: null,
          contextCharacters: null,
          source: 'system',
          archivedAt: null,
          bubbleColor: null,
          recommendedIdentities: null,
          zhihuHotTopic: null,
          authorId: null,
          tags: [{ tag: { id: 'tag1', name: 'test', category: null, createdAt: new Date() } }],
          author: { id: 'user1', name: 'Test User', image: null },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { db } = await import('@/lib/db');
      vi.mocked(db.brainhole.findMany).mockResolvedValue(mockBrainholes);
      vi.mocked(db.brainhole.count).mockResolvedValue(1);

      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/brainholes?page=1&limit=20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(1);
      expect(data.data.total).toBe(1);
      expect(data.data.page).toBe(1);
      expect(data.data.limit).toBe(20);
    });

    it('should handle validation errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/brainholes?page=invalid&limit=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500); // Zod validation error triggers internal server error
      expect(data.success).toBe(false);
    });

    it('should handle database errors', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.brainhole.findMany).mockRejectedValue(new Error('Database error'));
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/brainholes');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('POST /api/brainholes', () => {
    it('should create a brainhole when authenticated', async () => {
      const mockBrainhole = {
        id: 'brainhole1',
        title: 'New Brainhole',
        scenario: 'New Scenario',
        status: 'pending',
        difficulty: 'medium',
        category: 'general',
        hotScore: 0,
        recencyBoost: true,
        reactionCount: 0,
        sparkCount: 0,
        collectionCount: 0,
        contextTime: null,
        contextLocation: null,
        contextCharacters: null,
        source: 'user',
        archivedAt: null,
        bubbleColor: null,
        recommendedIdentities: null,
        zhihuHotTopic: null,
        authorId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSession = {
        user: { id: 'user1', name: 'Test User', email: 'test@example.com', image: null },
      };

      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(db.brainhole.create).mockResolvedValue(mockBrainhole);
      vi.mocked(db.tag.upsert).mockResolvedValue({ id: 'tag1', name: 'test', category: null, createdAt: new Date() });
      vi.mocked(db.brainholeTag.create).mockResolvedValue({ id: 'rel1', brainholeId: 'brainhole1', tagId: 'tag1' });

      const request = new NextRequest('http://localhost:3000/api/brainholes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Brainhole',
          scenario: 'New Scenario',
          difficulty: 'medium',
          tags: ['test'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('brainhole1');
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/brainholes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Brainhole',
          scenario: 'New Scenario',
          difficulty: 'medium',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle validation errors', async () => {
      const mockSession = {
        user: { id: 'user1', name: 'Test User' },
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/brainholes', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500); // Zod validation error triggers internal server error
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/brainholes/[id]', () => {
    it('should return brainhole details', async () => {
      const mockBrainhole = {
        id: 'brainhole1',
        title: 'Test Brainhole',
        scenario: 'Test Scenario',
        status: 'approved',
        difficulty: 'medium',
        tags: [{ tag: { id: 'tag1', name: 'test' } }],
        author: { id: 'user1', name: 'Test User', image: null, level: 1 },
        _count: { reactions: 5, collections: 3 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { db } = await import('@/lib/db');
      vi.mocked(db.brainhole.findUnique).mockResolvedValue(mockBrainhole as any);

      const request = new NextRequest('http://localhost:3000/api/brainholes/brainhole1');
      const response = await GETDetail(request, { params: Promise.resolve({ id: 'brainhole1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('brainhole1');
      expect(data.data.tags).toBeDefined();
      expect(data.data.reactionCount).toBe(5);
      expect(data.data.collectionCount).toBe(3);
    });

    it('should return 404 when brainhole not found', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.brainhole.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/brainholes/nonexistent');
      const response = await GETDetail(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('BRAINHOLE_NOT_FOUND');
    });
  });

  describe('POST /api/brainholes/[id]/collect', () => {
    it('should collect a brainhole when authenticated', async () => {
      const mockSession = {
        user: { id: 'user1', name: 'Test User' },
      };

      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(db.brainhole.findUnique).mockResolvedValue({
        id: 'brainhole1',
        title: 'Test Brainhole',
      } as any);
      vi.mocked(db.brainholeCollection.findUnique).mockResolvedValue(null);
      vi.mocked(db.brainholeCollection.create).mockResolvedValue({
        id: 'collect1',
        userId: 'user1',
        brainholeId: 'brainhole1',
      } as any);
      vi.mocked(db.brainhole.update).mockResolvedValue({} as any);

      const request = new NextRequest('http://localhost:3000/api/brainholes/brainhole1/collect', {
        method: 'POST',
      });

      const response = await POSTCollect(request, { params: Promise.resolve({ id: 'brainhole1' }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.success).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/brainholes/brainhole1/collect', {
        method: 'POST',
      });

      const response = await POSTCollect(request, { params: Promise.resolve({ id: 'brainhole1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 when brainhole not found', async () => {
      const mockSession = {
        user: { id: 'user1', name: 'Test User' },
      };

      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(db.brainhole.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/brainholes/nonexistent/collect', {
        method: 'POST',
      });

      const response = await POSTCollect(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('BRAINHOLE_NOT_FOUND');
    });

    it('should return 400 when already collected', async () => {
      const mockSession = {
        user: { id: 'user1', name: 'Test User' },
      };

      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(db.brainhole.findUnique).mockResolvedValue({
        id: 'brainhole1',
        title: 'Test Brainhole',
      } as any);
      vi.mocked(db.brainholeCollection.findUnique).mockResolvedValue({
        id: 'collect1',
        userId: 'user1',
        brainholeId: 'brainhole1',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/brainholes/brainhole1/collect', {
        method: 'POST',
      });

      const response = await POSTCollect(request, { params: Promise.resolve({ id: 'brainhole1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('BRAINHOLE_ALREADY_COLLECTED');
    });
  });
});