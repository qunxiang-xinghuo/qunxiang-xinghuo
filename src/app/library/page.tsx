'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { useCollection } from '@/hooks/useCollection';
import { useReaction } from '@/hooks/useReaction';
import { BookOpen, Sparkles, Globe, MessageSquare, Clock } from 'lucide-react';

const tabs = [
  { id: 'mine', label: '我的素材', icon: BookOpen },
  { id: 'public', label: '广场素材', icon: Globe },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('mine');
  const { collectedBrainholes } = useCollection();
  const { reactions } = useReaction();

  // 按脑洞分组
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const key = reaction.brainholeId || '未分类';
    if (!acc[key]) {
      acc[key] = {
        brainholeTitle: reaction.aiPrompt || '未知脑洞',
        items: [],
      };
    }
    acc[key].items.push(reaction);
    return acc;
  }, {} as Record<string, { brainholeTitle: string; items: typeof reactions }>);

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
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
            {/* 收藏脑洞 */}
            <div>
              <h3 className="text-xs text-white/40 mb-2 flex items-center gap-1">
                <BookOpen size={12} />
                收藏的脑洞
              </h3>
              {collectedBrainholes.length === 0 ? (
                <div className="text-center py-8 bg-white/5 rounded-xl">
                  <BookOpen className="w-10 h-10 text-white/10 mx-auto mb-2" />
                  <p className="text-white/30 text-xs">还没有收藏任何脑洞</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collectedBrainholes.map((brainhole) => (
                    <div
                      key={brainhole.id}
                      className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <h4 className="text-sm text-white/80 font-medium">{brainhole.title}</h4>
                      <p className="text-[11px] text-white/30 mt-1 line-clamp-2">{brainhole.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 对白记录 */}
            <div>
              <h3 className="text-xs text-white/40 mb-2 flex items-center gap-1">
                <MessageSquare size={12} />
                对白记录
              </h3>
              {Object.keys(groupedReactions).length === 0 ? (
                <div className="text-center py-8 bg-white/5 rounded-xl">
                  <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-2" />
                  <p className="text-white/30 text-xs">还没有任何对白记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedReactions).map(([key, group]) => (
                    <div key={key} className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <h4 className="text-sm text-xh-gold font-medium mb-2">{group.brainholeTitle}</h4>
                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <div key={item.id} className="bg-white/5 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-white/40">{item.identityLabel}</span>
                              <span className="text-[10px] text-white/20">
                                {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                            <p className="text-xs text-white/60">{item.content}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Sparkles size={10} className="text-xh-gold" />
                              <span className="text-[10px] text-xh-gold">{item.sparkCount} 火花</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* 广场素材 */
          <div className="text-center py-16">
            <Globe className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">广场素材即将开放</p>
            <p className="text-white/20 text-xs mt-1">用户可公开分享自己的精彩对白</p>
          </div>
        )}
      </div>
    </div>
  );
}
