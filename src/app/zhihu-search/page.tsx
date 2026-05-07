'use client';

import { useState, useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Search, Flame, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'site' | 'global' | 'hot';

export default function ZhihuSearchPage() {
  const [activeTab, setActiveTab] = useState<Tab>('site');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (activeTab === 'hot') {
      setLoading(true);
      setError('');
      const controller = new AbortController();
      fetch('/api/zhihu/hot-list?limit=10', { signal: controller.signal })
        .then(r => r.json())
        .then(json => {
          if (json.success) setResults(json.data.items || []);
          else setError(json.error?.message || '获取热榜失败');
        })
        .catch(() => setError('网络错误'))
        .finally(() => setLoading(false));
      return () => controller.abort();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'site' as Tab, label: '站内搜索', icon: Search },
    { id: 'global' as Tab, label: '全网搜索', icon: Globe },
    { id: 'hot' as Tab, label: '热榜', icon: Flame },
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const endpoint = activeTab === 'global' ? '/api/zhihu/global-search' : '/api/zhihu/search';
      const res = await fetch(`${endpoint}?query=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data.items || []);
      } else {
        setError(json.error?.message || '搜索失败');
        setResults([]);
      }
    } catch (e) {
      setError('网络错误');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setResults([]);
    setSearched(false);
    setError('');
  };

  return (
    <div className="flex flex-col h-full bg-xh-primary">
      <TopBar title="知乎搜索" />

      <div className="flex border-b border-white/5 shrink-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-xh-gold border-b-2 border-xh-gold'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab !== 'hot' && (
        <div className="px-4 py-3 flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="搜索知乎内容..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-xh-gold/50"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2.5 bg-xh-gold text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-xh-gold/90 transition-colors"
          >
            {loading ? '...' : '搜索'}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && results.length === 0 && searched && activeTab !== 'hot' && (
          <div className="text-center py-8">
            <p className="text-white/50 text-sm">暂无结果</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {results.map((item, i) => (
                <motion.div
                  key={item.ContentID || i}
                  initial={mounted ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                >
                  {activeTab === 'hot' ? (
                    <>
                      {item.ThumbnailUrl && (
                        <img src={item.ThumbnailUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                      )}
                      <h4 className="text-sm font-medium text-white/80 mb-1">{item.Title}</h4>
                      {item.Summary && (
                        <p className="text-xs text-white/40 line-clamp-2">{item.Summary}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-medium text-white/80 mb-1">{item.Title}</h4>
                      <p className="text-xs text-white/40 line-clamp-2 mb-2">{item.ContentText}</p>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span>{item.AuthorName}</span>
                        <span>👍 {item.VoteUpCount}</span>
                        <span>💬 {item.CommentCount}</span>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}