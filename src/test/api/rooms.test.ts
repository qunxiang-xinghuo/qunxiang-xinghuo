import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as POSTMessages } from '@/app/api/rooms/[roomId]/messages/route';
import { POST as POSTSpark } from '@/app/api/rooms/[roomId]/spark/route';
import { POST as POSTPause } from '@/app/api/rooms/[roomId]/pause/route';
import { POST as POSTResume } from '@/app/api/rooms/[roomId]/resume/route';
import { POST as POSTFinish } from '@/app/api/rooms/[roomId]/finish/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    room: { findUnique: vi.fn(), update: vi.fn() },
    roomParticipant: { findFirst: vi.fn() },
    roomMessage: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/server/room-manager', () => ({
  sendMessage: vi.fn(),
  markSpark: vi.fn(),
  getRoomWithParticipants: vi.fn(),
  updateRoomStatus: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Room API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/rooms/[roomId]/messages', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/messages', {
        method: 'POST',
        body: JSON.stringify({ content: 'Hello', identity: 'director' }),
      });
      const response = await POSTMessages(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(401);
    });

    it('should return 400 for empty content', async () => {
      const mockSession = { user: { id: 'user1', name: 'Test' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/messages', {
        method: 'POST',
        body: JSON.stringify({ content: '', identity: 'director' }),
      });
      const response = await POSTMessages(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/rooms/[roomId]/spark', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/spark', {
        method: 'POST',
        body: JSON.stringify({ messageId: 'cl12345678901234567890123' }),
      });
      const response = await POSTSpark(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid messageId', async () => {
      const mockSession = { user: { id: 'user1', name: 'Test' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/spark', {
        method: 'POST',
        body: JSON.stringify({ messageId: 'invalid' }),
      });
      const response = await POSTSpark(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/rooms/[roomId]/pause', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/pause', { method: 'POST' });
      const response = await POSTPause(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(401);
    });

    it('should return 404 when room not found', async () => {
      const { updateRoomStatus } = await import('@/server/room-manager');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(updateRoomStatus).mockRejectedValue(new Error('ROOM_NOT_FOUND'));
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/pause', { method: 'POST' });
      const response = await POSTPause(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(404);
    });

    it('should return 403 when user is not director', async () => {
      const { updateRoomStatus } = await import('@/server/room-manager');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(updateRoomStatus).mockRejectedValue(new Error('NOT_DIRECTOR'));
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/pause', { method: 'POST' });
      const response = await POSTPause(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/rooms/[roomId]/resume', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/resume', { method: 'POST' });
      const response = await POSTResume(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(401);
    });

    it('should return 404 when room not found', async () => {
      const { updateRoomStatus } = await import('@/server/room-manager');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(updateRoomStatus).mockRejectedValue(new Error('ROOM_NOT_FOUND'));
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/resume', { method: 'POST' });
      const response = await POSTResume(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/rooms/[roomId]/finish', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/finish', { method: 'POST' });
      const response = await POSTFinish(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not director', async () => {
      const { updateRoomStatus } = await import('@/server/room-manager');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(updateRoomStatus).mockRejectedValue(new Error('NOT_DIRECTOR'));
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/finish', { method: 'POST' });
      const response = await POSTFinish(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(403);
    });
  });

  describe('Happy path', () => {
    it('should send message successfully', async () => {
      const { sendMessage } = await import('@/server/room-manager');
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.room.findUnique).mockResolvedValue({ id: 'room1', status: 'active' } as any);
      vi.mocked(db.roomParticipant.findFirst).mockResolvedValue({ id: 'part_1', userId: 'user1' } as any);
      vi.mocked(sendMessage).mockResolvedValue({
        id: 'msg_1',
        roomId: 'room1',
        senderId: 'user1',
        content: '先推肾上腺素！',
        createdAt: new Date(),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/rooms/room1/messages', {
        method: 'POST',
        body: JSON.stringify({ content: '先推肾上腺素！', identity: '急诊科医生' }),
      });
      const response = await POSTMessages(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.content).toBe('先推肾上腺素！');
    });

    it('should mark spark successfully', async () => {
      const { markSpark } = await import('@/server/room-manager');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(markSpark).mockResolvedValue({
        id: 'msg_1',
        roomId: 'room1',
        content: '先推肾上腺素！',
        isSpark: true,
        sparkMarkedBy: 'user1',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/rooms/room1/spark', {
        method: 'POST',
        body: JSON.stringify({ messageId: 'cl123456789012345678901234' }),
      });
      const response = await POSTSpark(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.isSpark).toBe(true);
    });

    it('should pause room successfully', async () => {
      const { updateRoomStatus } = await import('@/server/room-manager');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(updateRoomStatus).mockResolvedValue({
        id: 'room1',
        status: 'paused',
        directorId: 'user1',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/rooms/room1/pause', { method: 'POST' });
      const response = await POSTPause(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('paused');
    });

    it('should resume room successfully', async () => {
      const { updateRoomStatus } = await import('@/server/room-manager');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(updateRoomStatus).mockResolvedValue({
        id: 'room1',
        status: 'active',
        directorId: 'user1',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/rooms/room1/resume', { method: 'POST' });
      const response = await POSTResume(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('active');
    });

    it('should finish room successfully', async () => {
      const { updateRoomStatus } = await import('@/server/room-manager');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(updateRoomStatus).mockResolvedValue({
        id: 'room1',
        status: 'finished',
        directorId: 'user1',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/rooms/room1/finish', { method: 'POST' });
      const response = await POSTFinish(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('finished');
    });
  });
});
