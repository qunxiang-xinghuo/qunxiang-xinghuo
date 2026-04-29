import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/rooms/[roomId]/inspirations/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    room: { findUnique: vi.fn() },
    roomParticipant: { findFirst: vi.fn() },
    inspirationItem: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Inspirations API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/rooms/room1/inspirations');
    const response = await GET(request, { params: Promise.resolve({ roomId: 'room1' }) });
    expect(response.status).toBe(401);
  });

  it('should return 404 when room not found', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(db.room.findUnique).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/rooms/room1/inspirations');
    const response = await GET(request, { params: Promise.resolve({ roomId: 'room1' }) });
    expect(response.status).toBe(404);
  });

  it('should return 403 when not a participant', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(db.room.findUnique).mockResolvedValue({ id: 'room1' } as any);
    vi.mocked(db.roomParticipant.findFirst).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/rooms/room1/inspirations');
    const response = await GET(request, { params: Promise.resolve({ roomId: 'room1' }) });
    expect(response.status).toBe(403);
  });

  it('should return inspirations successfully', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(db.room.findUnique).mockResolvedValue({ id: 'room1' } as any);
    vi.mocked(db.roomParticipant.findFirst).mockResolvedValue({
      id: 'part1', userId: 'user1', roomId: 'room1', isOnline: true,
    } as any);
    vi.mocked(db.inspirationItem.findMany).mockResolvedValue([
      { id: 'insp1', roomId: 'room1', content: '灵感1', createdAt: new Date() },
      { id: 'insp2', roomId: 'room1', content: '灵感2', createdAt: new Date() },
    ] as any);

    const request = new NextRequest('http://localhost:3000/api/rooms/room1/inspirations');
    const response = await GET(request, { params: Promise.resolve({ roomId: 'room1' }) });
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].content).toBe('灵感1');
  });
});
