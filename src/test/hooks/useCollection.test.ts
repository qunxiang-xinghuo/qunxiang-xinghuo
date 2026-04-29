import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCollection } from '@/hooks/useCollection';

describe('useCollection Hook', () => {
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

    const { result } = renderHook(() => useCollection());
    expect(result.current.loading).toBe(true);
    expect(result.current.collectedBrainholes).toEqual([]);
  });

  it('should load collections from API successfully', async () => {
    const mockData = {
      success: true,
      data: {
        brainholes: [
          { id: 'bh_1', title: '收藏1', scenario: '内容1', source: '知乎', tags: [] },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useCollection());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.collectedBrainholes).toHaveLength(1);
    expect(result.current.collectedBrainholes[0].title).toBe('收藏1');
    expect(result.current.error).toBeNull();
  });

  it('should handle API error gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, error: '加载失败' }),
    } as Response);

    const { result } = renderHook(() => useCollection());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.collectedBrainholes).toEqual([]);
    expect(result.current.error).toBe('加载失败');
  });

  it('should handle network error', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCollection());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
  });

  it('should collect brainhole successfully', async () => {
    const initialData = { success: true, data: { brainholes: [] } };
    const collectResponse = { success: true, data: { success: true } };
    const updatedData = {
      success: true,
      data: {
        brainholes: [
          { id: 'bh_1', title: '新收藏', scenario: '内容', source: '知乎', tags: [] },
        ],
      },
    };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ json: () => Promise.resolve(initialData) } as Response)
      .mockResolvedValueOnce({ json: () => Promise.resolve(collectResponse) } as Response)
      .mockResolvedValueOnce({ json: () => Promise.resolve(updatedData) } as Response);

    const { result } = renderHook(() => useCollection());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.collectBrainhole({
        id: 'bh_1',
        title: '新收藏',
        content: '内容',
        source: '知乎',
      });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/brainholes/bh_1/collect',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should uncollect brainhole successfully', async () => {
    const initialData = {
      success: true,
      data: {
        brainholes: [
          { id: 'bh_1', title: '收藏1', scenario: '内容', source: '知乎', tags: [] },
        ],
      },
    };
    const uncollectResponse = { success: true, data: { success: true } };
    const emptyData = { success: true, data: { brainholes: [] } };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ json: () => Promise.resolve(initialData) } as Response)
      .mockResolvedValueOnce({ json: () => Promise.resolve(uncollectResponse) } as Response)
      .mockResolvedValueOnce({ json: () => Promise.resolve(emptyData) } as Response);

    const { result } = renderHook(() => useCollection());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isCollected('bh_1')).toBe(true);

    await act(async () => {
      await result.current.uncollectBrainhole('bh_1');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/brainholes/bh_1/collect',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('should check if brainhole is collected', async () => {
    const mockData = {
      success: true,
      data: {
        brainholes: [
          { id: 'bh_1', title: '收藏1', scenario: '内容', source: '知乎', tags: [] },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useCollection());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isCollected('bh_1')).toBe(true);
    expect(result.current.isCollected('bh_2')).toBe(false);
  });

  it('should refresh collections', async () => {
    const initialData = { success: true, data: { brainholes: [] } };
    const refreshedData = {
      success: true,
      data: {
        brainholes: [
          { id: 'bh_1', title: '更新', scenario: '内容', source: '知乎', tags: [] },
        ],
      },
    };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ json: () => Promise.resolve(initialData) } as Response)
      .mockResolvedValueOnce({ json: () => Promise.resolve(refreshedData) } as Response);

    const { result } = renderHook(() => useCollection());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.collectedBrainholes).toHaveLength(0);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.collectedBrainholes).toHaveLength(1);
  });
});
