'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Zap, Clock, Users, Plus, ChevronRight, Sparkles, Flame,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

interface Story {
  id: string;
  title: string;
  genre: string;
  heat: number;
  participantCount: number;
  maxParticipants: number;
  status: string;
  secret: string;
  createdAt: string;
  creatorName?: string;
}

export default function StoryHallPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'match' | 'mine' | 'others'>('match');
  const [stories, setStories] = useState<Story[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('xh_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setUserId(u.id || '');
      } catch {}
    }
    loadStories();
  }, []);

  async function loadStories() {
    setLoading(true);
    try {
      const res = await fetch('/api/stories?status=active');
      const data = await res.json();
      const all = data.data?.stories || [];
      setStories(all);
      
      const raw = localStorage.getItem('xh_user');
      const u = raw ? JSON.parse(raw) : null;
      if (u) {
        setMyStories(all.filter((s: Story) => s.creatorName === u.name));
      }
    } catch (e) {
      console.error('故事大厅加载失败:', e);
    } finally {
      setLoading(false);
    }
  }

  const genreColors: Record<string, string> = {
    drama: 'from-red-500/20 to-orange-500/20',
    romance: 'from-pink-500/20 to-rose-500/20',
    mystery: 'from-purple-500/20 to-indigo-500/20',
    comedy: 'from-yellow-500/20 to-amber-500/20',
    scifi: 'from-cyan-500/20 to-blue-500/20',
    horror: 'from-gray-500/20 to-slate-500/20',
  };

  const genreNames: Record<string, string> = {
    drama: '现实', romance: '爱情', mystery: '悬疑',
    comedy: '喜剧', scifi: '科幻', horror: '惊悚',
  };

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="故事" subtitle="多人共创" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* 顶部快速操作 */}
        {tab === 'match' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 mb-6"
          >
            <button
              onClick={() => router.push('/story-hall/match')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#e2b04a]/20 to-orange-500/20 border border-[#e2b04a]/20 text-[#e2b04a] text-sm font-medium active:scale-[0.97] transition-all"
            >
              <Zap className="w-4 h-4" />
              快速匹配
            </button>
            <button
              onClick={() => router.push('/story-hall/create')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/80 text-sm font-medium active:scale-[0.97] transition-all"
            >
              <Plus className="w-4 h-4" />
              发起故事
            </button>
          </motion.div>
        )}

        {/* Tab 切换 */}
        <div className="flex gap-4 mb-4 border-b border-white/5 pb-3">
          {[
            { key: 'match', label: '快速匹配' },
            { key: 'mine', label: '我发起的' },
            { key: 'others', label: '其他人的' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
                tab === t.key
                  ? 'text-[#e2b04a] border-[#e2b04a]'
                  : 'text-white/30 border-transparent hover:text-white/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 内容 */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {tab === 'match' && (
              <>
                <p className="text-xs text-white/25 mb-3">点击快速匹配按钮加入正在等待的故事，或浏览下方的活跃故事</p>
                {stories.slice(0, 6).map((story, idx) => (
                  <StoryCard key={story.id} story={story} idx={idx} genreColors={genreColors} genreNames={genreNames} onClick={() => router.push(`/story/room/${story.id}`)} />
                ))}
              </>
            )}
            {tab === 'mine' && (
              myStories.length === 0 ? (
                <EmptyState icon={Sparkles} text="你还没有发起过故事" subtext="点击下方按钮发起第一个故事" />
              ) : (
                myStories.map((story, idx) => (
                  <StoryCard key={story.id} story={story} idx={idx} genreColors={genreColors} genreNames={genreNames} onClick={() => router.push(`/story/room/${story.id}`)} />
                ))
              )
            )}
            {tab === 'others' && (
              stories.filter(s => !myStories.find(ms => ms.id === s.id)).length === 0 ? (
                <EmptyState icon={Users} text="暂无其他人的故事" subtext="稍后再来看看" />
              ) : (
                stories
                  .filter(s => !myStories.find(ms => ms.id === s.id))
                  .map((story, idx) => (
                    <StoryCard key={story.id} story={story} idx={idx} genreColors={genreColors} genreNames={genreNames} onClick={() => router.push(`/story/room/${story.id}`)} />
                  ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StoryCard({ story, idx, genreColors, genreNames, onClick }: {
  story: Story; idx: number;
  genreColors: Record<string, string>;
  genreNames: Record<string, string>;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      onClick={onClick}
      className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all cursor-pointer"
    >
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${genreColors[story.genre] || genreColors.drama} rounded-bl-3xl opacity-30`} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/5">
            {genreNames[story.genre] || '其他'}
          </span>
          <span className="text-[10px] text-white/25">{story.creatorName || '匿名'}</span>
        </div>
        <h3 className="text-sm font-semibold text-white/90 mb-1">{story.title}</h3>
        <p className="text-xs text-white/30 line-clamp-1 mb-3">{story.secret}</p>
        <div className="flex items-center gap-3 text-[11px] text-white/25">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {story.participantCount}/{story.maxParticipants}
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-[#e2b04a]/40" />
            {story.heat}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, text, subtext }: { icon: any; text: string; subtext: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon className="w-10 h-10 text-white/10 mb-3" />
      <p className="text-sm text-white/30">{text}</p>
      <p className="text-xs text-white/20 mt-1">{subtext}</p>
    </div>
  );
}
