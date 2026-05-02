'use client';

import { useState, useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import { BookOpen, Globe, MessageSquare, Sparkles, Eye, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

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

const tabs = [
  { id: 'mine', label: '我的素材', icon: BookOpen },
  { id: 'public', label: '广场素材', icon: Globe },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('mine');
  const [myAssets, setMyAssets] = useState<AssetItem[]>([]);
  const [publicAssets, setPublicAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (err) {
      console.error('Toggle public failed:', err);
    }
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
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-xh-gold border-b-2 border-xh-gold'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {activeTab === 'mine' ? (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : myAssets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-white/[0.03] rounded-xl border border-white/[0.06]"
              >
                <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-2" />
                <p className="text-white/30 text-xs">还没有任何对白记录</p>
                <p className="text-white/20 text-[10px] mt-1">完成对白后可保存到素材库</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {myAssets.map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05] transition-all press-feedback"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-white/90 font-medium truncate">{asset.title}</h4>
                        {asset.summary && (
                          <p className="text-[11px] text-white/30 mt-1 line-clamp-2">{asset.summary}</p>
                        )}
                      </div>
                      <button
                        onClick={() => togglePublic(asset.id, asset.isPublic)}
                        className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                          asset.isPublic
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-white/5 text-white/30 hover:text-white/50'
                        }`}
                        title={asset.isPublic ? '已公开，点击取消' : '点击公开'}
                      >
                        {asset.isPublic ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-[10px] text-white/30">
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
        ) : (
          <>
            {publicAssets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-white/[0.03] rounded-xl border border-white/[0.06]"
              >
                <Globe className="w-10 h-10 text-white/10 mx-auto mb-2" />
                <p className="text-white/30 text-xs">广场暂无公开素材</p>
                <p className="text-white/20 text-[10px] mt-1">快去完成对白并公开分享吧</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {publicAssets.map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-xh-gold/20 flex items-center justify-center text-[10px] text-xh-gold">
                        {asset.user?.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-[10px] text-white/40">
                        {asset.user?.name || asset.user?.username || '匿名用户'}
                      </span>
                    </div>
                    <h4 className="text-sm text-white/90 font-medium">{asset.title}</h4>
                    {asset.summary && (
                      <p className="text-[11px] text-white/30 mt-1 line-clamp-2">{asset.summary}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-white/30">
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
      </div>
    </div>
  );
}
