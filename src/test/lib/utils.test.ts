import { describe, it, expect, vi } from 'vitest';
import { cn, apiResponse, apiError, validateEnvVars, type ApiResponse } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn() - Class name utility', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
      expect(cn('px-2', 'py-2', 'bg-red-500')).toBe('px-2 py-2 bg-red-500');
    });

    it('should handle conditional class names', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
    });

    it('should handle arrays and objects', () => {
      expect(cn(['class1', 'class2'], { class3: true, class4: false })).toBe('class1 class2 class3');
    });

    it('should merge Tailwind classes correctly', () => {
      expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });
  });

  describe('apiResponse()', () => {
    it('should create a successful API response', () => {
      const data = { id: '123', name: 'Test' };
      const result = apiResponse(data);

      expect(result).toEqual({
        success: true,
        data,
      });
      expect(result.success).toBe(true);
      expect(result.data).toBe(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle empty data', () => {
      const result = apiResponse(null);
      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });

    it('should handle complex data structures', () => {
      const data = {
        items: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
      };
      const result = apiResponse(data);
      expect(result.data!.items).toHaveLength(2);
      expect(result.data!.total).toBe(2);
    });
  });

  describe('apiError()', () => {
    it('should create an error API response', () => {
      const result = apiError('VALIDATION_ERROR', 'Invalid input data');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toBe('Invalid input data');
      expect(result.data).toBeUndefined();
    });

    it('should handle different error codes', () => {
      const result1 = apiError('UNAUTHORIZED', 'Authentication required');
      expect(result1.error?.code).toBe('UNAUTHORIZED');

      const result2 = apiError('NOT_FOUND', 'Resource not found');
      expect(result2.error?.code).toBe('NOT_FOUND');

      const result3 = apiError('INTERNAL_SERVER_ERROR', 'Something went wrong');
      expect(result3.error?.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle empty or null message', () => {
      const result = apiError('ERROR_CODE', '');
      expect(result.error?.message).toBe('');
    });
  });

  describe('ApiResponse type', () => {
    it('should match the expected TypeScript interface', () => {
      const successResponse: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '123' },
      };

      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'ERROR',
          message: 'Error message',
        },
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.data?.id).toBe('123');
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error?.code).toBe('ERROR');
    });
  });

  describe('validateEnvVars()', () => {
    it('should not throw when all required environment variables are present', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DATABASE_URL: 'sqlite://test.db',
        NEXTAUTH_SECRET: 'secret',
      };

      expect(() => validateEnvVars(['DATABASE_URL', 'NEXTAUTH_SECRET'])).not.toThrow();

      process.env = originalEnv;
    });

    it('should throw error when environment variables are missing', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DATABASE_URL: 'sqlite://test.db',
        // NEXTAUTH_SECRET is missing
      };

      expect(() => validateEnvVars(['DATABASE_URL', 'NEXTAUTH_SECRET']))
        .toThrow('Missing required environment variables: NEXTAUTH_SECRET');

      process.env = originalEnv;
    });

    it('should throw error when multiple environment variables are missing', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        // Both are missing
      };

      expect(() => validateEnvVars(['DATABASE_URL', 'NEXTAUTH_SECRET']))
        .toThrow('Missing required environment variables: DATABASE_URL, NEXTAUTH_SECRET');

      process.env = originalEnv;
    });

    it('should handle empty required variables list', () => {
      expect(() => validateEnvVars([])).not.toThrow();
    });
  });
});