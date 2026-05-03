'use client';

import { useState, useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import { BookOpen, Globe, Heart, MessageSquare, Sparkles, Eye, Lock, Unlock, ChevronRight, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface AssetItem {
  id: string;
  title: string;
  summary: string;
  messageCount: number;
  sparkCount: number;
  isPublic: boolean;
  createdAt: string;
  brainhole?: { title: string; scenario: string } | null;
  user?: { name: string | null; username: string | null } | null;
}

interface CollectedBrainhole {
  id: string;
  title: string;
  scenario: string;
  hotScore: number;
  category: string;
  source: string;
  collectedAt: string;
}

const tabs = [
  { id: 'mine', label: '我的素材', icon: BookOpen },
  { id: 'public', label: '广场素材', icon: Globe },
  { id: 'collected', label: '我的收藏', icon: Heart },
];

export default function LibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('mine');
  const [myAssets, setMyAssets] = useState<AssetItem[]>([]);
  const [publicAssets, setPublicAssets] = useState<AssetItem[]>([]);
  const [collectedBrainholes, setCollectedBrainholes] = useState<CollectedBrainhole[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCollected, setLoadingCollected] = useState(false);

  useEffect(() => {
    // 加载我的素材
    fetch('/api/assets')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.assets) {
          setMyAssets(res.data.assets);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // 加载广场素材
    fetch('/api/assets/public')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.assets) {
          setPublicAssets(res.data.assets);
        }
      })
      .catch(console.error);
  }, []);

  // v6.0: 加载收藏的脑洞
  useEffect(() => {
    if (activeTab === 'collected') {
      setLoadingCollected(true);
      fetch('/api/brainholes/collected')
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data?.items) {
            setCollectedBrainholes(res.data.items.map((item: any) => ({
              id: item.id,
              title: item.title,
              scenario: item.scenario || '',
              hotScore: item.hotScore || 50,
              category: item.category || 'general',
              source: item.source || 'user',
              collectedAt: item.collectedAt || item.createdAt,
            })));
          }
        })
        .catch(console.error)
        .finally(() => setLoadingCollected(false));
    }
  }, [activeTab]);

  const togglePublic = async (assetId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/assets/${assetId}/public`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !current }),
      });
      if (res.ok) {
        setMyAssets((prev) =>
          prev.map((a) => (a.id === assetId ? { ...a, isPublic: !current } : a))
        );
        const publicRes = await fetch('/api/assets/public');
        const publicResult = await publicRes.json();
        if (publicResult.success && publicResult.data?.assets) {
          setPublicAssets(publicResult.data.assets);
        }
      }
    } catch (err) {
      console.error('Toggle public failed:', err);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('确定要删除这个素材吗？删除后无法恢复。')) return;
    try {
      const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
      if (res.ok) {
        setMyAssets((prev) => prev.filter((a) => a.id !== assetId));
        setPublicAssets((prev) => prev.filter((a) => a.id !== assetId));
      } else {
        alert('删除失败，请稍后重试');
      }
    } catch (err) {
      console.error('Delete asset failed:', err);
      alert('删除失败，请检查网络');
    }
  };

  const handleCollectedClick = (brainhole: CollectedBrainhole) => {
    // v6.0: 点击收藏的脑洞 → 直接进入匹配流程
    localStorage.setItem('xh_duo_brainhole', brainhole.id);
    router.push(`/duo-match?brainholeId=${brainhole.id}&from=bubble`);
  };

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      medical: '医疗', legal: '法律', workplace: '职场', life: '生活',
      education: '教育', tech: '技术', emergency: '紧急', general: '综合',
      zhihu_hot: '知乎', zhihu_search: '知乎', deepseek: 'AI', fallback: '精选',
    };
    return map[cat] || cat;
  };

  const categoryColor = (cat: string) => {
    const map: Record<string, string> = {
      medical: 'text-red-400', legal: 'text-blue-400', workplace: 'text-orange-400',
      life: 'text-emerald-400', education: 'text-purple-400', tech: 'text-cyan-400',
      emergency: 'text-amber-400', general: 'text-slate-400',
      zhihu_hot: 'text-blue-400', zhihu_search: 'text-blue-400', deepseek: 'text-indigo-400',
    };
    return map[cat] || 'text-slate-400';
  };

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="素材库" />

      {/* 顶部标签页 */}
      <div className="flex border-b border-white/5 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 min-h-11 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-xh-gold border-b-2 border-xh-gold'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {/* 我的素材 */}
        {activeTab === 'mine' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : myAssets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-slate-800/40 rounded-xl border border-slate-700/20"
              >
                <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">还没有任何对白记录</p>
                <p className="text-slate-600 text-[10px] mt-1">完成对白后可保存到素材库</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {myAssets.map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`/library/${asset.id}`)}
                    className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/20 hover:border-slate-600/20 hover:bg-white/[0.05] transition-all press-feedback cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-slate-100 font-medium truncate">{asset.title}</h4>
                        {asset.summary && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{asset.summary}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePublic(asset.id, asset.isPublic); }}
                          className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                            asset.isPublic
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-slate-700/30 text-slate-500 hover:text-slate-400'
                          }`}
                          title={asset.isPublic ? '已公开，点击取消' : '点击公开'}
                        >
                          {asset.isPublic ? <Unlock size={14} /> : <Lock size={14} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                          className="shrink-0 p-1.5 rounded-lg transition-colors bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          title="删除素材"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={10} />
                        {asset.messageCount} 条对白
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles size={10} className="text-xh-gold" />
                        {asset.sparkCount} 火花
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={10} />
                        {asset.isPublic ? '广场可见' : '仅自己'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 广场素材 */}
        {activeTab === 'public' && (
          <>
            {publicAssets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-slate-800/40 rounded-xl border border-slate-700/20"
              >
                <Globe className="w-10 h-10 text-white/10 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">广场暂无公开素材</p>
                <p className="text-slate-600 text-[10px] mt-1">快去完成对白并公开分享吧</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {publicAssets.map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`/library/${asset.id}`)}
                    className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/20 hover:border-slate-600/20 hover:bg-white/[0.05] transition-all press-feedback cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-xh-gold/20 flex items-center justify-center text-[10px] text-xh-gold">
                        {asset.user?.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-[10px] text-slate-600">
                        {asset.user?.name || asset.user?.username || '匿名用户'}
                      </span>
                    </div>
                    <h4 className="text-sm text-slate-100 font-medium">{asset.title}</h4>
                    {asset.summary && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{asset.summary}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={10} />
                        {asset.messageCount} 条对白
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles size={10} className="text-xh-gold" />
                        {asset.sparkCount} 火花
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* v6.0: 我的收藏 */}
        {activeTab === 'collected' && (
          <>
            {loadingCollected ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : collectedBrainholes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-slate-800/40 rounded-xl border border-slate-700/20"
              >
                <Heart className="w-10 h-10 text-white/10 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">还没有收藏任何脑洞</p>
                <p className="text-slate-600 text-[10px] mt-1">点击泡泡即可收藏感兴趣的话题</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {collectedBrainholes.map((brainhole, index) => (
                  <motion.div
                    key={brainhole.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleCollectedClick(brainhole)}
                    className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/20 hover:border-slate-600/20 hover:bg-white/[0.05] transition-all press-feedback cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full bg-slate-700/30 ${categoryColor(brainhole.category)}`}>
                            {categoryLabel(brainhole.category)}
                          </span>
                          <span className="text-[10px] text-slate-600">
                            {new Date(brainhole.collectedAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <h4 className="text-sm text-slate-100 font-medium">{brainhole.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{brainhole.scenario}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-6" />
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Sparkles size={10} className="text-xh-gold" />
                        热度 {brainhole.hotScore}
                      </span>
                      <span className="text-xh-gold/60">点击即可匹配</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
