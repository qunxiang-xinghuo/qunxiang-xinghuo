'use client';

import TopBar from '@/components/layout/TopBar';
import { ScrollText, Clock } from 'lucide-react';

export default function StoryPage() {
  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="故事" />

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-xh-gold/10 flex items-center justify-center mx-auto mb-4 border border-xh-gold/20">
            <ScrollText className="w-10 h-10 text-xh-gold/60" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">故事大厅</h2>
          <p className="text-sm text-white/40 mb-6">认领角色，共创群像故事</p>

          <div className="flex items-center gap-2 justify-center mb-8">
            <Clock className="w-4 h-4 text-xh-gold/50" />
            <span className="text-xs text-xh-gold/50">即将开放</span>
          </div>

          <div className="space-y-3 text-left">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <h3 className="text-sm text-white/70 font-medium mb-1">发起故事</h3>
              <p className="text-xs text-white/30">创建一个群像故事项目，设定世界观和角色</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <h3 className="text-sm text-white/70 font-medium mb-1">认领角色</h3>
              <p className="text-xs text-white/30">浏览进行中的故事，选择心仪角色加入</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <h3 className="text-sm text-white/70 font-medium mb-1">群像共创</h3>
              <p className="text-xs text-white/30">多人实时协作，共同书写精彩故事</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
