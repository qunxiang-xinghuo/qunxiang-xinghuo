import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBrainhole } from '@/hooks/useBrainhole';

describe('useBrainhole Hook', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should start with loading state', () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: { brainholes: [] } }),
    } as Response);

    const { result } = renderHook(() => useBrainhole());
    expect(result.current.loading).toBe(true);
    expect(result.current.brainholes).toEqual([]);
  });

  it('should load brainholes from API successfully', async () => {
    const mockData = {
      success: true,
      data: {
        brainholes: [
          { id: 'bh_1', title: 'Test Title', scenario: 'Test Content', source: '知乎', tags: [{ name: 'test' }] },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useBrainhole());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.brainholes).toHaveLength(1);
    expect(result.current.brainholes[0].title).toBe('Test Title');
    expect(result.current.brainholes[0].source).toBe('知乎');
    expect(result.current.error).toBeNull();
  });

  it('should fallback to mock data when API returns error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, error: 'Server error' }),
    } as Response);

    const { result } = renderHook(() => useBrainhole());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.brainholes.length).toBeGreaterThan(0);
    expect(result.current.error).toBe('Server error');
  });

  it('should fallback to mock data on network error', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useBrainhole());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.brainholes.length).toBeGreaterThan(0);
    expect(result.current.error).toContain('网络错误');
  });

  it('should find brainhole by id', async () => {
    const mockData = {
      success: true,
      data: {
        brainholes: [
          { id: 'bh_1', title: 'Title 1', scenario: 'Content 1', source: '知乎' },
          { id: 'bh_2', title: 'Title 2', scenario: 'Content 2', source: '知乎' },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useBrainhole());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const found = result.current.getBrainholeById('bh_2');
    expect(found?.title).toBe('Title 2');
    expect(result.current.getBrainholeById('nonexistent')).toBeUndefined();
  });

  it('should return a random prompt', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: { brainholes: [] } }),
    } as Response);

    const { result } = renderHook(() => useBrainhole());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const prompt = result.current.getRandomPrompt();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });
});
