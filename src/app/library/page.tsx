'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { useCollection } from '@/hooks/useCollection';
import { useReaction } from '@/hooks/useReaction';
import { BookOpen, Sparkles } from 'lucide-react';

const tabs = [
  { id: 'collections', label: '收藏脑洞', icon: BookOpen },
  { id: 'reactions', label: '我的反应', icon: Sparkles },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('collections');
  const { collectedBrainholes } = useCollection();
  const { reactions } = useReaction();

  return (
    <div className="flex flex-col h-full">
      <TopBar title="我的素材库" />

      <div className="flex border-b border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-xh-gold border-b-2 border-xh-gold'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {activeTab === 'collections' ? (
          collectedBrainholes.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">还没有收藏任何脑洞</p>
              <p className="text-gray-600 text-xs mt-1">去脑洞广场右滑收藏喜欢的脑洞吧</p>
            </div>
          ) : (
            collectedBrainholes.map((brainhole) => (
              <div
                key={brainhole.id}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {brainhole.source}
                  </span>
                </div>
                <h3 className="text-white font-medium mb-1 text-base">{brainhole.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{brainhole.content}</p>
              </div>
            ))
          )
        ) : reactions.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">还没有记录任何反应</p>
            <p className="text-gray-600 text-xs mt-1">去脑洞广场记录你的第一反应吧</p>
          </div>
        ) : (
          reactions.map((reaction) => (
            <div
              key={reaction.id}
              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-xh-accent flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {reaction.identityLabel}
                </span>
                <span className="text-[10px] text-gray-600">
                  {new Date(reaction.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{reaction.aiPrompt}</p>
              <p className="text-white text-sm">{reaction.content}</p>
              <div className="flex items-center justify-end mt-2 gap-2">
                <div className="flex items-center gap-1 text-xs text-xh-gold">
                  <Sparkles size={12} />
                  <span>{reaction.sparkCount} 个火花</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
