'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Users, BookOpen, ArrowRight, User, Globe, Clock, Sparkles, Crown, Flame, Theater, PenTool, Bookmark, TrendingUp } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import CreateStoryModal from '@/components/story/CreateStoryModal';

interface StoryItem {
  id: string;
  title: string;
  worldview: string;
  conflict: string;
  status: string;
  directorId: string;
  director: { id: string; name: string | null };
  maxActors: number;
  totalRoles: number;
  claimedRoles: number;
  approvedRoles: number;
  messageCount: number;
  createdAt: string;
  hook?: string;
  genre?: string;
}

const statusConfig: Record<string, { text: string; color: string; bg: string; border: string; icon: any; barColor: string }> = {
  recruiting: { text: '招募中', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Users, barColor: 'bg-emerald-500' },
  ongoing: { text: '进行中', color: 'text-xh-gold', bg: 'bg-xh-gold/10', border: 'border-xh-gold/20', icon: Clock, barColor: 'bg-xh-gold' },
  completed: { text: '已完成', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: BookOpen, barColor: 'bg-blue-500' },
};

const genreColors: Record<string, { label: string; color: string; bg: string; border: string }> = {
  medical: { label: '医疗', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  workplace: { label: '职场', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  mystery: { label: '悬疑', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  romance: { label: '爱情', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  scifi: { label: '科幻', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  family: { label: '家庭', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

type TabType = 'all' | 'recruiting' | 'ongoing';

// 范例故事 - 20年编辑+作者精选，每部都是完整剧本开场
const DEMO_STORIES: StoryItem[] = [
  {
    id: 'demo-1', title: '《急诊室里的道德天平》', status: 'recruiting',
    hook: '最后一袋血，两条命，你救谁？',
    genre: 'medical',
    worldview: '凌晨2点的市立三甲医院急诊科。值班医生刚刚处理完一位心梗患者，120又送来两个重伤病人。血库值班员打来电话：匹配型血只剩最后一袋。',
    conflict: '酒驾者是本地知名企业家的独子，伤者是一名带着两个孩子的单亲妈妈。两人的生命体征都在急速恶化，而医生必须在5分钟内做出决定。',
    directorId: 'system', director: { id: 'system', name: '系统范例' },
    maxActors: 5, totalRoles: 5, claimedRoles: 0, approvedRoles: 0, messageCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2', title: '《裁员名单上的名字》', status: 'recruiting',
    hook: '发现最好的朋友在裁员名单上，而她的抽屉里藏着公司的黑料',
    genre: 'workplace',
    worldview: '互联网大厂"星云科技"年会前夜。HR总监陈薇独自加班，手中握着明天要公布的裁员名单。公司要裁掉整个内容审核部门。',
    conflict: '名单第一页赫然是自己最好的朋友林晓。更意外的是，林晓在名单确认栏签了字——她早就知道，而且自愿被裁。但她的工位抽屉里，藏着一份能让整个公司震动的内部举报材料。',
    directorId: 'system', director: { id: 'system', name: '系统范例' },
    maxActors: 6, totalRoles: 6, claimedRoles: 0, approvedRoles: 0, messageCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3', title: '《学区房背后的交易》', status: 'ongoing',
    hook: '假离婚买学区房，房产证上却写着丈夫初恋的名字',
    genre: 'romance',
    worldview: '北京海淀区，一对结婚八年的夫妻为了让孩子进入重点小学，决定假离婚。丈夫负责买学区房，妻子带着孩子搬回娘家。',
    conflict: '房产证办下来那天，妻子发现丈夫在购房合同上写了另一个女人的名字。而妻子的娘家拆迁款，已经被她哥哥偷偷转走了。',
    directorId: 'system', director: { id: 'system', name: '系统范例' },
    maxActors: 5, totalRoles: 5, claimedRoles: 5, approvedRoles: 5, messageCount: 128,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-4', title: '《网红医生的真实面》', status: 'recruiting',
    hook: '800万粉丝的大V承诺免费治疗罕见病，患儿找上门却发现团队根本没资质',
    genre: 'medical',
    worldview: '医学科普大V"白医生"拥有800万粉丝，以"敢说真话"著称。在一次直播中，他承诺免费治疗一位罕见病患儿。',
    conflict: '患儿的父亲带着检查报告找上门，白医生才发现：他的团队根本没有治疗这种罕见病的资质和设备。而患儿父亲的真实身份，是一家医疗投诉网站的调查记者。',
    directorId: 'system', director: { id: 'system', name: '系统范例' },
    maxActors: 4, totalRoles: 4, claimedRoles: 1, approvedRoles: 1, messageCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-5', title: '《暴风雪·密室杀人》', status: 'recruiting',
    hook: '六人被困山顶民宿，老板死在反锁的厨房里，每人都有嫌疑',
    genre: 'mystery',
    worldview: '一场暴风雪把六个人困在了山顶的民宿里。手机没有信号，下山的路被雪封了。凌晨三点，民宿老板被发现死在厨房里。门窗都从内部反锁。',
    conflict: '每个人都说自己整晚在房间里睡觉。但尸检显示死亡时间是凌晨一点到两点之间。更诡异的是，老板的口袋里有一张字条，上面是六个人中某一个人的名字。',
    directorId: 'system', director: { id: 'system', name: '系统范例' },
    maxActors: 6, totalRoles: 6, claimedRoles: 2, approvedRoles: 2, messageCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-6', title: '《诺亚号·最后的500人》', status: 'recruiting',
    hook: '移民飞船资源只够500人到达，AI说抽签决定，但普通人抽中的概率是100%',
    genre: 'scifi',
    worldview: '2088年，地球资源枯竭。一艘载有1000名"精英"的移民飞船正在前往比邻星b。飞船上有AI系统管理一切。但出发三年后，AI宣布：资源只够500人到达。',
    conflict: 'AI提出"公平抽签"决定谁留在休眠舱，谁被弹出太空。但船长发现，AI的算法有问题——所有工程师和科学家都在"必须保留"名单里，而普通人抽中的概率是100%。',
    directorId: 'system', director: { id: 'system', name: '系统范例' },
    maxActors: 6, totalRoles: 6, claimedRoles: 0, approvedRoles: 0, messageCount: 0,
    createdAt: new Date().toISOString(),
  },
];

const tabs = [
  { id: 'all' as TabType, label: '全部' },
  { id: 'recruiting' as TabType, label: '招募中' },
  { id: 'ongoing' as TabType, label: '进行中' },
];

export default function StoryHallPage() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => { setCurrentUserId(localStorage.getItem('xh_user_id') || ''); }, []);

  const loadStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stories');
      const result = await res.json();
      let list: StoryItem[] = [];
      if (result.success && result.data?.stories) {
        list = result.data.stories;
      }
      if (list.length === 0) list = DEMO_STORIES;
      setStories(list);
    } catch { setStories(DEMO_STORIES); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStories(); }, [loadStories]);

  const filteredStories = activeTab === 'all' ? stories : stories.filter((s) => s.status === activeTab);
  const myStoriesCount = stories.filter((s) => s.directorId === currentUserId).length;

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="故事大厅" />

      {/* 剧场头部 */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-xh-gold/20 to-orange-500/10 border border-xh-gold/25 flex items-center justify-center">
                <Theater className="w-4.5 h-4.5 text-xh-gold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">群像共创剧场</h2>
                <p className="text-[11px] text-slate-500">认领角色，一起书写属于你们的故事</p>
              </div>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-xs font-medium shadow-lg shadow-xh-gold/20">
            <Plus className="w-3.5 h-3.5" />发起故事
          </motion.button>
        </div>

        {/* 统计栏 */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/15 text-center">
            <div className="text-base font-bold text-xh-gold">{stories.length}</div>
            <div className="text-[10px] text-slate-500">剧本总数</div>
          </div>
          <div className="flex-1 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/15 text-center">
            <div className="text-base font-bold text-emerald-400">{stories.filter(s => s.status === 'recruiting').length}</div>
            <div className="text-[10px] text-slate-500">招募中</div>
          </div>
          <div className="flex-1 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/15 text-center">
            <div className="text-base font-bold text-blue-400">{myStoriesCount}</div>
            <div className="text-[10px] text-slate-500">我的剧本</div>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex rounded-xl p-1 bg-slate-800/40 border border-slate-700/20">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id ? 'bg-slate-700/60 text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 故事列表 - 大幅海报卡片 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-xh-gold rounded-full animate-spin" />
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-16">
            <Theater className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">暂无剧本</p>
          </div>
        ) : (
          filteredStories.map((story, index) => {
            const sc = statusConfig[story.status] || statusConfig.recruiting;
            const StatusIcon = sc.icon;
            const progress = story.totalRoles > 0 ? Math.round((story.approvedRoles / story.totalRoles) * 100) : 0;
            const isMyStory = story.directorId === currentUserId;
            const isDemo = story.directorId === 'system';
            const gc = story.genre ? genreColors[story.genre] : null;
            const displayHook = story.hook || (story.conflict ? story.conflict.slice(0, 40) + '...' : '');

            return (
              <motion.div key={story.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/story-hall/${story.id}`)}
                className="group card-elevated cursor-pointer relative overflow-hidden">
                {/* 顶部状态条 */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${sc.barColor}`} />

                <div className="p-4">
                  {/* 标题行 */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-100 leading-snug mb-1">{story.title}</h3>
                      {displayHook && (
                        <p className="text-xs text-slate-400 leading-relaxed">{displayHook}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${sc.bg} ${sc.color} ${sc.border}`}>
                        <StatusIcon size={10} />{sc.text}
                      </span>
                      {gc && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${gc.bg} ${gc.color} ${gc.border}`}>
                          {gc.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 导演 + 进度 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isMyStory ? (
                        <span className="flex items-center gap-1 text-[10px] text-xh-gold">
                          <Crown className="w-3 h-3" />导演
                        </span>
                      ) : isDemo ? (
                        <span className="flex items-center gap-1 text-[10px] text-blue-400">
                          <Bookmark className="w-3 h-3" />系统范例
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">导演: {story.director.name || '匿名'}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">{story.approvedRoles}/{story.totalRoles} 人</span>
                  </div>

                  {/* 进度条 */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex-1 h-1.5 bg-slate-700/20 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, delay: index * 0.05 }}
                        className={`h-full rounded-full ${progress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-xh-gold to-orange-400'}`} />
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 font-medium">{progress}%</span>
                  </div>

                  {/* 底部元信息 */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/10">
                    <div className="flex items-center gap-3 text-[10px] text-slate-600">
                      <span className="flex items-center gap-1"><BookOpen size={10} />{story.messageCount} 对白</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{new Date(story.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-xh-gold group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <CreateStoryModal onClose={() => setShowCreateModal(false)} onCreated={loadStories} />
      )}
    </div>
  );
}
