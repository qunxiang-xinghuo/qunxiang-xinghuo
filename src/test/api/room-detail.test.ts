import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/rooms/[roomId]/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/server/room-manager', () => ({
  getRoomWithParticipants: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Room Detail API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/rooms/room1');
    const response = await GET(request, { params: Promise.resolve({ roomId: 'room1' }) });
    expect(response.status).toBe(401);
  });

  it('should return 404 when room not found', async () => {
    const { getRoomWithParticipants } = await import('@/server/room-manager');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(getRoomWithParticipants).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/rooms/room1');
    const response = await GET(request, { params: Promise.resolve({ roomId: 'room1' }) });
    expect(response.status).toBe(404);
  });

  it('should return 403 when not a participant', async () => {
    const { getRoomWithParticipants } = await import('@/server/room-manager');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(getRoomWithParticipants).mockResolvedValue({
      id: 'room1',
      participants: [{ userId: 'user2', identity: '导演' }],
    } as any);
    const request = new NextRequest('http://localhost:3000/api/rooms/room1');
    const response = await GET(request, { params: Promise.resolve({ roomId: 'room1' }) });
    expect(response.status).toBe(403);
  });

  it('should return room details successfully', async () => {
    const { getRoomWithParticipants } = await import('@/server/room-manager');
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
    vi.mocked(getRoomWithParticipants).mockResolvedValue({
      id: 'room1',
      status: 'active',
      directorId: 'user1',
      participants: [
        { userId: 'user1', identity: '导演', isOnline: true },
        { userId: 'user2', identity: '演员', isOnline: true },
      ],
      messages: [],
    } as any);
    const request = new NextRequest('http://localhost:3000/api/rooms/room1');
    const response = await GET(request, { params: Promise.resolve({ roomId: 'room1' }) });
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('room1');
    expect(json.data.participants).toHaveLength(2);
  });
});
