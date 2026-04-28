import { describe, it, expect } from 'vitest';
import {
  brainholeCreateSchema,
  brainholeQuerySchema,
  brainholeCollectSchema,
} from '@/lib/validators/brainhole';
import {
  matchRequestSchema,
  matchCancelSchema,
  matchStatusSchema,
} from '@/lib/validators/match';
import {
  reactionCreateSchema,
  reactionQuerySchema,
} from '@/lib/validators/reaction';
import {
  voteCreateSchema,
  voteCastSchema,
} from '@/lib/validators/vote';

describe('Validator Tests', () => {
  describe('Brainhole Validators', () => {
    describe('brainholeCreateSchema', () => {
      it('should validate valid brainhole creation data', () => {
        const validData = {
          title: 'Test Brainhole',
          scenario: 'This is a test scenario',
          contextTime: 'Modern day',
          contextLocation: 'New York',
          contextCharacters: 'John, Mary',
          difficulty: 'medium' as const,
          tags: ['test', 'drama'],
        };

        const result = brainholeCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          ...validData,
          tags: ['test', 'drama'],
        });
      });

      it('should set default values for missing optional fields', () => {
        const minimalData = {
          title: 'Test Brainhole',
          scenario: 'This is a test scenario',
          difficulty: 'medium' as const,
        };

        const result = brainholeCreateSchema.safeParse(minimalData);
        expect(result.success).toBe(true);
        expect(result.data?.contextTime).toBeUndefined();
        expect(result.data?.contextLocation).toBeUndefined();
        expect(result.data?.contextCharacters).toBeUndefined();
        expect(result.data?.tags).toEqual([]);
      });

      it('should reject empty title', () => {
        const invalidData = {
          title: '',
          scenario: 'This is a test scenario',
          difficulty: 'medium' as const,
        };

        const result = brainholeCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('标题不能为空');
      });

      it('should reject title that is too long', () => {
        const invalidData = {
          title: 'a'.repeat(201),
          scenario: 'This is a test scenario',
          difficulty: 'medium' as const,
        };

        const result = brainholeCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('标题不能超过200字');
      });

      it('should reject empty scenario', () => {
        const invalidData = {
          title: 'Test Brainhole',
          scenario: '',
          difficulty: 'medium' as const,
        };

        const result = brainholeCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('情境描述不能为空');
      });

      it('should reject invalid difficulty', () => {
        const invalidData = {
          title: 'Test Brainhole',
          scenario: 'This is a test scenario',
          difficulty: 'invalid' as any,
        };

        const result = brainholeCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('brainholeQuerySchema', () => {
      it('should validate valid query parameters', () => {
        const validQuery = {
          page: '1',
          limit: '20',
          difficulty: 'hard',
          status: 'approved',
          tag: 'drama',
          search: 'test',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        };

        const result = brainholeQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          page: 1,
          limit: 20,
          difficulty: 'hard',
          status: 'approved',
          tag: 'drama',
          search: 'test',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
      });

      it('should set default values for missing parameters', () => {
        const minimalQuery = {};

        const result = brainholeQuerySchema.safeParse(minimalQuery);
        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
      });

      it('should coerce string numbers to numbers', () => {
        const query = {
          page: '2',
          limit: '10',
        };

        const result = brainholeQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
        expect(result.data?.page).toBe(2);
        expect(result.data?.limit).toBe(10);
      });

      it('should reject invalid page number', () => {
        const invalidQuery = {
          page: '0',
          limit: '20',
        };

        const result = brainholeQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
      });

      it('should reject limit that is too high', () => {
        const invalidQuery = {
          page: '1',
          limit: '101',
        };

        const result = brainholeQuerySchema.safeParse(invalidQuery);
        expect(result.success).toBe(false);
      });
    });

    describe('brainholeCollectSchema', () => {
      it('should validate valid collection data', () => {
        const validData = {
          brainholeId: 'cl123456789012345678901234',
        };

        const result = brainholeCollectSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid brainhole ID', () => {
        const invalidData = {
          brainholeId: 'invalid-id',
        };

        const result = brainholeCollectSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('无效的脑洞ID');
      });
    });
  });

  describe('Match Validators', () => {
    describe('matchRequestSchema', () => {
      it('should validate valid match request', () => {
        const validData = {
          brainholeId: 'cl123456789012345678901234',
          identity: 'director',
          preferDifferent: true,
          timeoutMinutes: '10',
        };

        const result = matchRequestSchema.safeParse(validData);
        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          brainholeId: 'cl123456789012345678901234',
          identity: 'director',
          preferDifferent: true,
          timeoutMinutes: 10,
        });
      });

      it('should set default values', () => {
        const minimalData = {
          brainholeId: 'cl123456789012345678901234',
          identity: 'actor',
        };

        const result = matchRequestSchema.safeParse(minimalData);
        expect(result.success).toBe(true);
        expect(result.data?.preferDifferent).toBe(true);
        expect(result.data?.timeoutMinutes).toBe(10);
      });

      it('should reject empty identity', () => {
        const invalidData = {
          brainholeId: 'cl123456789012345678901234',
          identity: '',
        };

        const result = matchRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('身份标签不能为空');
      });

      it('should reject timeout minutes that are too high', () => {
        const invalidData = {
          brainholeId: 'cl123456789012345678901234',
          identity: 'director',
          timeoutMinutes: '61',
        };

        const result = matchRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('matchCancelSchema', () => {
      it('should validate valid cancel request', () => {
        const validData = {
          matchId: 'cl123456789012345678901234',
        };

        const result = matchCancelSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid match ID', () => {
        const invalidData = {
          matchId: 'invalid-id',
        };

        const result = matchCancelSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('matchStatusSchema', () => {
      it('should validate valid status request', () => {
        const validData = {
          matchId: 'cl123456789012345678901234',
        };

        const result = matchStatusSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Reaction Validators', () => {
    describe('reactionCreateSchema', () => {
      it('should validate valid reaction creation', () => {
        const validData = {
          content: 'This is a reaction',
          identity: 'actor',
          emotionTag: 'excited',
          mediaUrl: 'https://example.com/media.mp3',
          mediaDuration: 30,
          brainholeId: 'cl123456789012345678901234',
          roomId: 'cl123456789012345678901235',
        };

        const result = reactionCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty content', () => {
        const invalidData = {
          content: '',
          identity: 'actor',
          brainholeId: 'cl123456789012345678901234',
        };

        const result = reactionCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('反应内容不能为空');
      });

      it('should reject content that is too long', () => {
        const invalidData = {
          content: 'a'.repeat(5001),
          identity: 'actor',
          brainholeId: 'cl123456789012345678901234',
        };

        const result = reactionCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('反应内容不能超过5000字');
      });

      it('should reject invalid media URL', () => {
        const invalidData = {
          content: 'Test reaction',
          identity: 'actor',
          brainholeId: 'cl123456789012345678901234',
          mediaUrl: 'not-a-url',
        };

        const result = reactionCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('媒体URL格式不正确');
      });
    });

    describe('reactionQuerySchema', () => {
      it('should validate valid query parameters', () => {
        const validQuery = {
          page: '1',
          limit: '20',
          brainholeId: 'cl123456789012345678901234',
          roomId: 'cl123456789012345678901235',
          userId: 'cl123456789012345678901236',
          identity: 'director',
          isSpark: true,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        };

        const result = reactionQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
        expect(result.data?.isSpark).toBe(true);
      });
    });
  });

  describe('Vote Validators', () => {
    describe('voteCreateSchema', () => {
      it('should validate valid vote creation', () => {
        const validData = {
          roomId: 'cl123456789012345678901234',
          question: 'Which option do you prefer?',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
            { text: 'Option 3' },
          ],
        };

        const result = voteCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty question', () => {
        const invalidData = {
          roomId: 'cl123456789012345678901234',
          question: '',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
        };

        const result = voteCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('投票问题不能为空');
      });

      it('should reject question that is too long', () => {
        const invalidData = {
          roomId: 'cl123456789012345678901234',
          question: 'a'.repeat(501),
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
        };

        const result = voteCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('投票问题不能超过500字');
      });

      it('should reject too few options', () => {
        const invalidData = {
          roomId: 'cl123456789012345678901234',
          question: 'Which option?',
          options: [
            { text: 'Option 1' },
          ],
        };

        const result = voteCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('至少需要2个选项');
      });

      it('should reject too many options', () => {
        const invalidData = {
          roomId: 'cl123456789012345678901234',
          question: 'Which option?',
          options: Array.from({ length: 7 }, (_, i) => ({ text: `Option ${i + 1}` })),
        };

        const result = voteCreateSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('最多6个选项');
      });
    });

    describe('voteCastSchema', () => {
      it('should validate valid vote cast', () => {
        const validData = {
          voteId: 'cl123456789012345678901234',
          optionIdx: 0,
        };

        const result = voteCastSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject negative option index', () => {
        const invalidData = {
          voteId: 'cl123456789012345678901234',
          optionIdx: -1,
        };

        const result = voteCastSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('无效的选项索引');
      });
    });
  });
});