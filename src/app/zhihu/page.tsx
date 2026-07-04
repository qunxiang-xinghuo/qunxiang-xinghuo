'use client';

import { useState } from 'react';

interface SearchResult {
  id: string;
  title: string;
  excerpt?: string;
  url?: string;
  author?: {
    name: string;
  };
  answer_count?: number;
}

interface HotItem {
  id: string;
  title: string;
  excerpt?: string;
  url?: string;
  hot_score?: number;
}

type SearchType = 'zhihu_search' | 'global_search' | 'hot_list';

export default function ZhihuSearchPage() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('zhihu_search');
  const [results, setResults] = useState<SearchResult[] | HotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() && searchType !== 'hot_list') {
      setError('请输入搜索关键词');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await fetch('/api/zhihu/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, type: searchType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '搜索失败');
      }

      // Handle different response formats
      if (data.data && Array.isArray(data.data)) {
        setResults(data.data);
      } else if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败，请稍后重试');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHotList = async () => {
    setSearchType('hot_list');
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await fetch('/api/zhihu/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'hot_list' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '获取热榜失败');
      }

      if (data.data && Array.isArray(data.data)) {
        setResults(data.data);
      } else if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取热榜失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-serif text-blue-900 mb-2">知乎搜索</h1>
          <p className="text-blue-600 text-sm">搜索知乎内容，获取灵感与素材</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入搜索关键词..."
              className="flex-1 px-4 py-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>

          <div className="flex gap-3 items-center">
            <span className="text-sm text-blue-700">搜索类型：</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value="zhihu_search"
                checked={searchType === 'zhihu_search'}
                onChange={() => setSearchType('zhihu_search')}
                className="text-blue-500 focus:ring-blue-400"
              />
              <span className="text-sm text-blue-800">知乎搜索</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value="global_search"
                checked={searchType === 'global_search'}
                onChange={() => setSearchType('global_search')}
                className="text-blue-500 focus:ring-blue-400"
              />
              <span className="text-sm text-blue-800">全网搜索</span>
            </label>
            <button
              type="button"
              onClick={handleLoadHotList}
              className="ml-auto px-4 py-2 bg-orange-400 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              🔥 知乎热榜
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-blue-900 font-medium mb-1">知乎 API 尚未配置</p>
                <p className="text-blue-700 text-sm mb-3">
                  要使用知乎搜索功能，需要先在知乎开放平台获取 Access Secret。
                </p>
                <div className="bg-white rounded p-3 text-sm text-blue-800">
                  <p className="font-medium mb-2">配置步骤：</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>访问 <a href="https://open.zhihu.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">知乎开放平台</a></li>
                    <li>登录并进入个人中心</li>
                    <li>获取你的 Access Secret</li>
                    <li>在环境变量中设置 <code className="bg-blue-100 px-1 rounded">ZHIHU_ACCESS_SECRET</code></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-blue-600">正在搜索...</p>
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-12 text-blue-600">
                没有找到相关内容
              </div>
            ) : (
              <>
                <p className="text-sm text-blue-600 mb-4">
                  找到 {results.length} 条结果
                </p>
                {results.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-5 bg-white rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="text-lg font-medium text-blue-900 mb-2">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 hover:underline"
                        >
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </h3>
                    {item.excerpt && (
                      <p className="text-blue-700 text-sm leading-relaxed mb-3">
                        {item.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-blue-500">
                      {'author' in item && item.author && (
                        <span>作者：{item.author.name}</span>
                      )}
                      {'answer_count' in item && item.answer_count !== undefined && (
                        <span>{item.answer_count} 个回答</span>
                      )}
                      {'hot_score' in item && item.hot_score !== undefined && (
                        <span className="text-orange-500 font-medium">
                          🔥 {item.hot_score} 热度
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-serif text-blue-900 mb-2">开始搜索</h2>
            <p className="text-blue-600">
              输入关键词搜索知乎内容，或查看知乎热榜获取灵感
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
