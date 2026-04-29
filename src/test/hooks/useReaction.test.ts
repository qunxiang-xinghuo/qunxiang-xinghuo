import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useReaction } from '@/hooks/useReaction';

describe('useReaction Hook', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should start with loading state', () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: { reactions: [] } }),
    } as Response);

    const { result } = renderHook(() => useReaction('bh_1'));
    expect(result.current.loading).toBe(true);
    expect(result.current.reactions).toEqual([]);
  });

  it('should load reactions from API successfully', async () => {
    const mockData = {
      success: true,
      data: {
        reactions: [
          { id: 'r_1', brainholeId: 'bh_1', identity: '导演', content: '精彩', isSpark: true, createdAt: '2024-01-01' },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useReaction('bh_1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reactions).toHaveLength(1);
    expect(result.current.reactions[0].identityLabel).toBe('导演');
    expect(result.current.reactions[0].isSparked).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle API error gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, error: '加载失败' }),
    } as Response);

    const { result } = renderHook(() => useReaction('bh_1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reactions).toEqual([]);
    expect(result.current.error).toBe('加载失败');
  });

  it('should handle network error', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useReaction('bh_1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
  });

  it('should submit reaction successfully', async () => {
    const getMock = {
      success: true,
      data: { reactions: [] },
    };
    const postMock = {
      success: true,
      data: { id: 'r_2', brainholeId: 'bh_1', identity: '演员', content: '感人', isSpark: false, createdAt: '2024-01-02' },
    };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ json: () => Promise.resolve(getMock) } as Response)
      .mockResolvedValueOnce({ json: () => Promise.resolve(postMock) } as Response)
      .mockResolvedValueOnce({ json: () => Promise.resolve(getMock) } as Response);

    const { result } = renderHook(() => useReaction('bh_1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let submitted: any;
    await act(async () => {
      submitted = await result.current.submitReaction({
        brainholeId: 'bh_1',
        identityLabel: '演员',
        content: '感人',
        aiPrompt: '',
      });
    });

    expect(submitted).not.toBeNull();
    expect(submitted?.identityLabel).toBe('演员');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reactions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('感人'),
      })
    );
  });

  it('should toggle spark locally', async () => {
    const mockData = {
      success: true,
      data: {
        reactions: [
          { id: 'r_1', brainholeId: 'bh_1', identity: '导演', content: '好', isSpark: false, createdAt: '2024-01-01' },
        ],
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useReaction('bh_1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.toggleSpark('r_1');
    });

    expect(result.current.reactions[0].isSparked).toBe(true);
    expect(result.current.reactions[0].sparkCount).toBe(1);

    act(() => {
      result.current.toggleSpark('r_1');
    });

    expect(result.current.reactions[0].isSparked).toBe(false);
    expect(result.current.reactions[0].sparkCount).toBe(0);
  });

  it('should refresh reactions', async () => {
    const initialData = { success: true, data: { reactions: [] } };
    const refreshedData = {
      success: true,
      data: {
        reactions: [
          { id: 'r_1', brainholeId: 'bh_1', identity: '导演', content: '更新', isSpark: false, createdAt: '2024-01-01' },
        ],
      },
    };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ json: () => Promise.resolve(initialData) } as Response)
      .mockResolvedValueOnce({ json: () => Promise.resolve(refreshedData) } as Response);

    const { result } = renderHook(() => useReaction('bh_1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reactions).toHaveLength(0);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.reactions).toHaveLength(1);
  });
});
