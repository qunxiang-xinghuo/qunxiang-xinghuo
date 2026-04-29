import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as POSTCreateVote } from '@/app/api/rooms/[roomId]/vote/route';
import { POST as POSTCastVote } from '@/app/api/rooms/[roomId]/vote/[voteId]/cast/route';
import { POST as POSTResolveVote } from '@/app/api/rooms/[roomId]/vote/[voteId]/resolve/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    room: { findUnique: vi.fn(), update: vi.fn() },
    vote: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    voteOption: { create: vi.fn() },
    voteCast: { findFirst: vi.fn(), create: vi.fn() },
    roomParticipant: { findFirst: vi.fn() },
    inspirationItem: { create: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Vote API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/rooms/[roomId]/vote', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote', {
        method: 'POST',
        body: JSON.stringify({ question: 'A or B?', options: ['A', 'B'] }),
      });
      const response = await POSTCreateVote(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(401);
    });

    it('should return 400 for validation error', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote', {
        method: 'POST',
        body: JSON.stringify({ question: '', options: [] }),
      });
      const response = await POSTCreateVote(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(400);
    });

    it('should return 404 when room not found', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.room.findUnique).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote', {
        method: 'POST',
        body: JSON.stringify({ question: 'A or B?', options: ['A', 'B'] }),
      });
      const response = await POSTCreateVote(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(404);
    });

    it('should return 403 when user is not director', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.room.findUnique).mockResolvedValue({ id: 'room1', directorId: 'user2', status: 'active' } as any);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote', {
        method: 'POST',
        body: JSON.stringify({ question: 'A or B?', options: ['A', 'B'] }),
      });
      const response = await POSTCreateVote(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(403);
    });

    it('should return 400 when room status is invalid', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.room.findUnique).mockResolvedValue({ id: 'room1', directorId: 'user1', status: 'finished' } as any);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote', {
        method: 'POST',
        body: JSON.stringify({ question: 'A or B?', options: ['A', 'B'] }),
      });
      const response = await POSTCreateVote(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(400);
    });

    it('should create vote successfully', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.room.findUnique).mockResolvedValue({ id: 'room1', directorId: 'user1', status: 'active' } as any);
      vi.mocked(db.vote.create).mockResolvedValue({
        id: 'vote1',
        roomId: 'room1',
        question: 'A or B?',
        status: 'open',
        options: [{ id: 'opt1', idx: 0, text: 'A' }, { id: 'opt2', idx: 1, text: 'B' }],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote', {
        method: 'POST',
        body: JSON.stringify({ question: 'A or B?', options: ['A', 'B'] }),
      });
      const response = await POSTCreateVote(request, { params: Promise.resolve({ roomId: 'room1' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.question).toBe('A or B?');
      expect(json.data.status).toBe('open');
    });
  });

  describe('POST /api/rooms/[roomId]/vote/[voteId]/cast', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/cast', {
        method: 'POST',
        body: JSON.stringify({ optionIndex: 0 }),
      });
      const response = await POSTCastVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(401);
    });

    it('should return 400 for validation error', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/cast', {
        method: 'POST',
        body: JSON.stringify({ optionIndex: -1 }),
      });
      const response = await POSTCastVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(400);
    });

    it('should return 404 when vote not found', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.vote.findUnique).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/cast', {
        method: 'POST',
        body: JSON.stringify({ optionIndex: 0 }),
      });
      const response = await POSTCastVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(404);
    });

    it('should return 400 when vote is closed', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.vote.findUnique).mockResolvedValue({
        id: 'vote1', roomId: 'room1', status: 'closed', options: [{ id: 'opt1', idx: 0, text: 'A' }],
      } as any);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/cast', {
        method: 'POST',
        body: JSON.stringify({ optionIndex: 0 }),
      });
      const response = await POSTCastVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid option index', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.vote.findUnique).mockResolvedValue({
        id: 'vote1', roomId: 'room1', status: 'open', options: [{ id: 'opt1', idx: 0, text: 'A' }],
      } as any);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/cast', {
        method: 'POST',
        body: JSON.stringify({ optionIndex: 5 }),
      });
      const response = await POSTCastVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(400);
    });

    it('should return 400 when already voted', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.vote.findUnique).mockResolvedValue({
        id: 'vote1', roomId: 'room1', status: 'open', options: [{ id: 'opt1', idx: 0, text: 'A' }],
      } as any);
      vi.mocked(db.voteCast.findFirst).mockResolvedValue({ id: 'cast1', voteId: 'vote1', userId: 'user1' } as any);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/cast', {
        method: 'POST',
        body: JSON.stringify({ optionIndex: 0 }),
      });
      const response = await POSTCastVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(400);
    });

    it('should return 403 when not a participant', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.vote.findUnique).mockResolvedValue({
        id: 'vote1', roomId: 'room1', status: 'open', options: [{ id: 'opt1', idx: 0, text: 'A' }],
      } as any);
      vi.mocked(db.voteCast.findFirst).mockResolvedValue(null);
      vi.mocked(db.roomParticipant.findFirst).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/cast', {
        method: 'POST',
        body: JSON.stringify({ optionIndex: 0 }),
      });
      const response = await POSTCastVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(403);
    });

    it('should cast vote successfully', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.vote.findUnique).mockResolvedValue({
        id: 'vote1', roomId: 'room1', status: 'open', options: [{ id: 'opt1', idx: 0, text: 'A' }],
      } as any);
      vi.mocked(db.voteCast.findFirst).mockResolvedValue(null);
      vi.mocked(db.roomParticipant.findFirst).mockResolvedValue({ id: 'part1', userId: 'user1', roomId: 'room1', isOnline: true } as any);
      vi.mocked(db.voteCast.create).mockResolvedValue({ id: 'cast1', voteId: 'vote1', userId: 'user1', optionId: 'opt1' } as any);

      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/cast', {
        method: 'POST',
        body: JSON.stringify({ optionIndex: 0 }),
      });
      const response = await POSTCastVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.success).toBe(true);
    });
  });

  describe('POST /api/rooms/[roomId]/vote/[voteId]/resolve', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/resolve', {
        method: 'POST',
        body: JSON.stringify({ winnerOptionIndex: 0 }),
      });
      const response = await POSTResolveVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(401);
    });

    it('should return 404 when vote not found', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.vote.findUnique).mockResolvedValue(null);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/resolve', {
        method: 'POST',
        body: JSON.stringify({ winnerOptionIndex: 0 }),
      });
      const response = await POSTResolveVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(404);
    });

    it('should return 400 when vote is already closed', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.vote.findUnique).mockResolvedValue({
        id: 'vote1', roomId: 'room1', status: 'closed', options: [{ id: 'opt1', idx: 0, text: 'A' }], casts: [],
      } as any);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/resolve', {
        method: 'POST',
        body: JSON.stringify({ winnerOptionIndex: 0 }),
      });
      const response = await POSTResolveVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(400);
    });

    it('should return 403 when user is not director', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.vote.findUnique).mockResolvedValue({
        id: 'vote1', roomId: 'room1', status: 'open', options: [{ id: 'opt1', idx: 0, text: 'A' }], casts: [],
      } as any);
      vi.mocked(db.room.findUnique).mockResolvedValue({ id: 'room1', directorId: 'user2' } as any);
      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/resolve', {
        method: 'POST',
        body: JSON.stringify({ winnerOptionIndex: 0 }),
      });
      const response = await POSTResolveVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(403);
    });

    it('should resolve vote successfully', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user1', name: 'Test' } } as any);
      vi.mocked(db.vote.findUnique).mockResolvedValue({
        id: 'vote1', roomId: 'room1', status: 'open',
        options: [{ id: 'opt1', idx: 0, text: 'A' }, { id: 'opt2', idx: 1, text: 'B' }],
        casts: [{ id: 'cast1', voteId: 'vote1', userId: 'user1', optionId: 'opt1' }],
      } as any);
      vi.mocked(db.room.findUnique).mockResolvedValue({ id: 'room1', directorId: 'user1' } as any);
      vi.mocked(db.vote.update).mockResolvedValue({
        id: 'vote1', status: 'closed', winnerOptionIdx: 0,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/rooms/room1/vote/vote1/resolve', {
        method: 'POST',
        body: JSON.stringify({ winnerOptionIndex: 0, moveToInspiration: [1] }),
      });
      const response = await POSTResolveVote(request, { params: Promise.resolve({ roomId: 'room1', voteId: 'vote1' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('closed');
    });
  });
});
