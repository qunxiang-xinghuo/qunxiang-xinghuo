'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, MessageSquare, ArrowRight, UserCheck, Lock, Check, X, Clock, Play, Shield, UserCircle, Tag, PenTool, Crown, Flame, BookOpen, Theater, Star, Scroll, Eye, KeyRound, Target, Zap, Bookmark } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import ClaimRoleModal from '@/components/story/ClaimRoleModal';

interface StoryRole {
  id: string; name: string; description: string; requirements: string | null;
  claimedBy: string | null; claimedAt: string | null; claimReason: string | null;
  claimStatus: string; identityTag: string | null; performanceDirection: string | null;
  user: { id: string; name: string | null } | null;
  secret?: string;
  motive?: string;
}

interface StoryDetail {
  id: string; title: string; worldview: string; conflict: string;
  status: string; director: { id: string; name: string | null };
  maxActors: number; minActors: number; roles: StoryRole[];
  chapters: { id: string; title: string; status: string }[];
  messages: any[]; createdAt: string;
  _count: { messages: number; inspirations: number };
  hook?: string;
  genre?: string;
}

const statusConfig: Record<string, any> = {
  recruiting: { text: '招募演员', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Users, barColor: 'bg-emerald-500', gradient: 'from-emerald-500/10 to-teal-500/5' },
  ongoing: { text: '正在上演', color: 'text-xh-gold', bg: 'bg-xh-gold/10', border: 'border-xh-gold/20', icon: Clock, barColor: 'bg-xh-gold', gradient: 'from-xh-gold/10 to-orange-500/5' },
  completed: { text: '已杀青', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: MessageSquare, barColor: 'bg-blue-500', gradient: 'from-blue-500/10 to-cyan-500/5' },
};

const claimConfig: Record<string, any> = {
  unclaimed: { text: '待认领', color: 'text-slate-400', bg: 'bg-slate-700/20', border: 'border-slate-600/20', icon: UserCircle, avatarBg: 'bg-slate-700/40' },
  pending: { text: '试镜中', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock, avatarBg: 'bg-amber-500/20' },
  approved: { text: '已入组', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Check, avatarBg: 'bg-emerald-500/20' },
  rejected: { text: '未通过', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: X, avatarBg: 'bg-red-500/20' },
};

const DEMO_STORIES: Record<string, StoryDetail> = {
  'demo-1': {
    id: 'demo-1', title: '《急诊室里的道德天平》', hook: '最后一袋血，两条命，你救谁？', genre: 'medical',
    worldview: '凌晨2点的市立三甲医院急诊科。值班医生刚刚处理完一位心梗患者，120又送来两个重伤病人。血库值班员打来电话：匹配型血只剩最后一袋。',
    conflict: '酒驾者是本地知名企业家的独子，伤者是一名带着两个孩子的单亲妈妈。两人的生命体征都在急速恶化，而医生必须在5分钟内做出决定。',
    status: 'recruiting', director: { id: 'system', name: '系统范例' },
    maxActors: 5, minActors: 3, roles: [
      { id: 'r1', name: '急诊科医生', description: '值班主治医生，需要在道德与职责之间做出抉择', requirements: '具备医学背景或医疗剧演绎经验', claimedBy: null, claimedAt: null, claimReason: null, claimStatus: 'unclaimed', identityTag: null, performanceDirection: null, user: null, secret: '三年前曾因为类似的选择救错了人，至今内疚', motive: '不想再让任何人死在自己面前' },
      { id: 'r2', name: '酒驾肇事者', description: '富二代，酒醒后懊悔不已', requirements: '能演绎复杂的内疚与求生欲望', claimedBy: null, claimedAt: null, claimReason: null, claimStatus: 'unclaimed', identityTag: null, performanceDirection: null, user: null, secret: '其实是替朋友顶罪', motive: '活着出去见未婚妻最后一面' },
      { id: 'r3', name: '伤者家属', description: '单亲妈妈的姐姐，连夜赶到医院', requirements: '情感爆发力强的演绎', claimedBy: null, claimedAt: null, claimReason: null, claimStatus: 'unclaimed', identityTag: null, performanceDirection: null, user: null, secret: '知道肇事者的真实身份', motive: '让肇事者付出代价' },
      { id: 'r4', name: '护士', description: '跟随医生多年的资深护士', requirements: '理性与同情心的平衡', claimedBy: null, claimedAt: null, claimReason: null, claimStatus: 'unclaimed', identityTag: null, performanceDirection: null, user: null, secret: '私下记录了医生三年前的失误', motive: '保护医生不被旧事牵连' },
      { id: 'r5', name: '血库管理员', description: '负责调配血源的后勤人员', requirements: '官僚体制下的无奈与坚持', claimedBy: null, claimedAt: null, claimReason: null, claimStatus: 'unclaimed', identityTag: null, performanceDirection: null, user: null, secret: '和肇事者的父亲是旧相识', motive: '不想卷入这场风波' },
    ], chapters: [], messages: [], createdAt: new Date().toISOString(), _count: { messages: 0, inspirations: 0 },
  },
  'demo-2': {
    id: 'demo-2', title: '《裁员名单上的名字》', hook: '发现最好的朋友在裁员名单上，而她的抽屉里藏着公司的黑料', genre: 'workplace',
    worldview: '互联网大厂"星云科技"年会前夜。HR总监独自加班，手中握着明天要公布的裁员名单。公司要裁掉整个内容审核部门。',
    conflict: '名单第一页赫然是自己最好的朋友。更意外的是，朋友在名单确认栏签了字——她早就知道，而且自愿被裁。但她的工位抽屉里，藏着一份能让整个公司震动的内部举报材料。',
    status: 'recruiting', director: { id: 'system', name: '系统范例' },
    maxActors: 6, minActors: 3, roles: [
      { id: 'r1', name: 'HR总监', description: '手握裁员名单，发现好友也在其中', requirements: '职场精英的干练与私情的挣扎', claimedBy: null, claimedAt: null, claimReason: null, claimStatus: 'unclaimed', identityTag: null, performanceDirection: null, user: null, secret: '自己也曾是举报人', motive: '保住职位的同时保住朋友' },
      { id: 'r2', name: '被裁员工', description: '自愿被裁，但工位藏着公司黑料', requirements: '表面顺从，内心复仇的张力', claimedBy: null, claimedAt: null, claimReason: null, claimStatus: 'unclaimed', identityTag: null, performanceDirection: null, user: null, secret: '举报材料其实有假', motive: '逼公司主动和解，拿到赔偿金' },
      { id: 'r3', name: '部门经理', description: '审核部门负责人，极力想保住团队', requirements: '夹在上下级之间的无奈', claimedBy: null, claimedAt: null, claimReason: null, claimStatus: 'unclaimed', identityTag: null, performanceDirection: null, user: null, secret: '早就知道裁员计划，一直在暗中准备', motive: '带领团队集体跳槽到竞品' },
      { id: 'r4', name: '投资人代表', description: '施压要求裁员的幕后推手', requirements: '冷酷理性的资本家嘴脸', claimedBy: null, claimedAt: null, claimReason: null, claimStatus: 'unclaimed', identityTag: null, performanceDirection: null, user: null, secret: '其实也在被自己的投资人施压', motive: '完成KPI保住自己的位置' },
      { id: 'r5', name: '公司法务', description: '收到匿名举报后的应对者', requirements: '在正义与公司利益间游走', claimedBy: null, claimedAt: null, claimReason: null, claimStatus: 'unclaimed', identityTag: null, performanceDirection: null, user: null, secret: '和被裁员工是大学同学', motive: '暗中帮助同学拿到最大赔偿' },
    ], chapters: [], messages: [], createdAt: new Date().toISOString(), _count: { messages: 0, inspirations: 0 },
  },
};

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.storyId as string;

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingRole, setClaimingRole] = useState<StoryRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => { setCurrentUserId(localStorage.getItem('xh_user_id') || ''); }, []);

  const [loadError, setLoadError] = useState('');

  const loadStory = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    if (storyId.startsWith('demo-')) {
      const demo = DEMO_STORIES[storyId];
      if (demo) { setStory(demo); setLoading(false); return; }
    }
    try {
      const res = await fetch(`/api/stories/${storyId}`);
      const result = await res.json();
      if (result.success && result.data?.story) {
        setStory(result.data.story);
      } else {
        setLoadError(result.error?.message || '剧本加载失败');
      }
    } catch { setLoadError('网络错误，请重试'); }
    finally { setLoading(false); }
  }, [storyId]);

  useEffect(() => { loadStory(); }, [loadStory]);

  const isDirector = story?.director.id === currentUserId;
  const allApproved = story ? story.roles.every((r) => r.claimStatus === 'approved') : false;
  const pendingRoles = story ? story.roles.filter((r) => r.claimStatus === 'pending' && r.claimedBy) : [];
  const sc = story ? statusConfig[story.status] || statusConfig.recruiting : statusConfig.recruiting;
  const isDemo = storyId.startsWith('demo-');
  const progress = story && story.roles.length > 0 ? Math.round((story.roles.filter(r => r.claimStatus === 'approved').length / story.roles.length) * 100) : 0;

  const handleReview = async (roleId: string, action: 'approve' | 'reject') => {
    if (isDemo) return;
    setReviewing(roleId);
    try {
      const res = await fetch(`/api/stories/${storyId}/roles/${roleId}/review`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (result.success) loadStory();
      else setLoadError(result.error?.message || '审核失败');
    } catch { setLoadError('网络错误，审核失败'); }
    setReviewing(null);
  };

  const handleStartStory = async () => {
    if (isDemo || !allApproved) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/start`, { method: 'POST' });
      const result = await res.json();
      if (result.success) loadStory();
      else setLoadError(result.error?.message || '启动失败');
    } catch { setLoadError('网络错误，启动失败'); }
    setStarting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full page-gradient">
        <TopBar title="剧本详情" showBack onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-xh-gold rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex flex-col h-full page-gradient">
        <TopBar title="剧本详情" showBack onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center">
          {loadError ? (
            <div className="text-center">
              <p className="text-red-400 text-sm mb-2">{loadError}</p>
              <button onClick={loadStory} className="text-xs text-xh-gold hover:underline">重试</button>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">剧本不存在</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="剧本详情" showBack onBack={() => router.back()} />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* 剧目海报头部 */}
        <div className="px-5 pt-5 pb-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-0 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${sc.gradient} opacity-40 pointer-events-none`} />
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-xh-gold/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-5">
              {/* 标签行 */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border font-medium ${sc.bg} ${sc.color} ${sc.border}`}>
                  <sc.icon size={11} />{sc.text}
                </span>
                {isDemo && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <Bookmark className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] text-blue-400 font-medium">系统范例</span>
                  </span>
                )}
                {isDirector && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-xh-gold/10 border border-xh-gold/20">
                    <Crown className="w-3 h-3 text-xh-gold" />
                    <span className="text-[10px] text-xh-gold font-medium">导演</span>
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Shield size={10} />{story.director.name || '匿名'}
                </span>
              </div>

              {/* 大标题 + hook */}
              <h2 className="text-xl font-bold text-slate-100 mb-2 leading-tight">{story.title}</h2>
              {story.hook && (
                <p className="text-sm text-xh-gold font-medium mb-3">{story.hook}</p>
              )}

              {/* 统计数字 */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center"><div className="text-lg font-bold text-xh-gold">{story.roles.length}</div><div className="text-[10px] text-slate-500">角色</div></div>
                <div className="w-px h-8 bg-slate-700/30" />
                <div className="text-center"><div className="text-lg font-bold text-xh-gold">{story._count.messages}</div><div className="text-[10px] text-slate-500">对白</div></div>
                <div className="w-px h-8 bg-slate-700/30" />
                <div className="text-center"><div className="text-lg font-bold text-xh-gold">{story.roles.filter(r => r.claimStatus === 'approved').length}</div><div className="text-[10px] text-slate-500">已入组</div></div>
                <div className="w-px h-8 bg-slate-700/30" />
                <div className="text-center"><div className="text-lg font-bold text-slate-500">{new Date(story.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</div><div className="text-[10px] text-slate-500">创建</div></div>
              </div>

              {/* 进度条 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">演员招募进度</span>
                  <span className="text-[10px] text-slate-400 font-medium">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-700/20 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${progress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-xh-gold to-orange-400'}`} />
                </div>
              </div>

              {/* 剧本卡片 */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/15 mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Theater className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">第一幕 · 开场白</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{story.worldview}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-r from-xh-gold/8 to-orange-500/5 border border-xh-gold/15">
                <div className="flex items-center gap-1.5 mb-2">
                  <Flame className="w-3.5 h-3.5 text-xh-gold/70" />
                  <span className="text-[10px] text-xh-gold/70 font-medium uppercase tracking-wider">核心冲突</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{story.conflict}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 角色表 - 剧本式 */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-xh-gold" />
              <h3 className="text-sm font-semibold text-slate-200">演员表</h3>
            </div>
            <div className="flex items-center gap-2">
              {story.roles.some(r => r.secret) && (
                <button onClick={() => setShowSecrets(!showSecrets)}
                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-colors ${
                    showSecrets ? 'bg-xh-gold/15 text-xh-gold border-xh-gold/25' : 'bg-slate-700/30 text-slate-500 border-slate-600/20'
                  }`}>
                  <KeyRound className="w-3 h-3" />{showSecrets ? '隐藏秘密' : '查看秘密'}
                </button>
              )}
              <span className="text-[11px] text-slate-600 font-medium">{story.roles.filter((r) => r.claimStatus === 'approved').length}/{story.roles.length} 就位</span>
            </div>
          </div>

          <div className="space-y-2">
            {story.roles.map((role, index) => {
              const cs = claimConfig[role.claimStatus] || claimConfig.unclaimed;
              const CSIcon = cs.icon;
              const isMyClaim = role.claimedBy === currentUserId;
              const canClaim = !role.claimedBy && story.status === 'recruiting' && role.claimStatus === 'unclaimed';

              return (
                <motion.div key={role.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
                  className={`card-elevated p-3.5 relative overflow-hidden ${
                    role.claimStatus === 'approved' ? 'border-l-2 border-l-emerald-500' :
                    role.claimStatus === 'pending' ? 'border-l-2 border-l-amber-400' : ''
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${cs.avatarBg} ${cs.color} border ${cs.border}`}>
                      {role.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold text-slate-100">{role.name}</span>
                        <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cs.bg} ${cs.color} ${cs.border}`}>
                          <CSIcon size={9} />{cs.text}
                        </span>
                        {isMyClaim && role.claimStatus === 'pending' && (
                          <span className="text-[10px] text-amber-400 font-medium">我的申请</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-1.5">{role.description}</p>

                      {/* 秘密和动机 */}
                      <AnimatePresence>
                        {showSecrets && role.secret && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="p-2 rounded-lg bg-red-500/8 border border-red-500/15 mb-1.5">
                              <div className="flex items-center gap-1 mb-0.5">
                                <KeyRound className="w-3 h-3 text-red-400/70" />
                                <span className="text-[10px] text-red-400/70 font-medium">隐藏秘密</span>
                              </div>
                              <p className="text-[11px] text-red-300/80">{role.secret}</p>
                            </div>
                            {role.motive && (
                              <div className="p-2 rounded-lg bg-xh-gold/8 border border-xh-gold/15">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Target className="w-3 h-3 text-xh-gold/70" />
                                  <span className="text-[10px] text-xh-gold/70 font-medium">核心动机</span>
                                </div>
                                <p className="text-[11px] text-xh-gold/80">{role.motive}</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* 认领者信息 */}
                      {role.claimedBy && role.user && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700/15 mt-1.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-xh-gold/30 to-orange-500/20 flex items-center justify-center text-[10px] text-xh-gold font-bold border border-xh-gold/20">
                            {role.user.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-xs text-slate-400 font-medium">{role.user.name || '匿名演员'}</span>
                          {role.identityTag && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500 ml-auto">
                              <Tag size={9} />{role.identityTag}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {canClaim && (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); setClaimingRole(role); }}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-xh-gold/15 text-xh-gold text-xs font-medium hover:bg-xh-gold/25 transition-colors border border-xh-gold/20">
                        认领
                      </motion.button>
                    )}
                  </div>

                  {isDirector && role.claimStatus === 'pending' && role.claimedBy && (
                    <div className="mt-2.5 flex items-center gap-2 pt-2.5 border-t border-slate-700/20">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); handleReview(role.id, 'approve'); }} disabled={reviewing === role.id}
                        className="flex-1 py-2 rounded-xl bg-emerald-500/12 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 border border-emerald-500/20">
                        <Check size={14} />通过
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); handleReview(role.id, 'reject'); }} disabled={reviewing === role.id}
                        className="flex-1 py-2 rounded-xl bg-red-500/12 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 border border-red-500/20">
                        <X size={14} />拒绝
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 导演待审核 */}
        {isDirector && pendingRoles.length > 0 && story.status === 'recruiting' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-3">
            <div className="bg-amber-500/[0.04] rounded-xl p-3.5 border border-amber-500/15">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">待审核试镜 ({pendingRoles.length})</span>
              </div>
              <p className="text-[11px] text-slate-500">通过所有角色的审核后，即可启动故事</p>
            </div>
          </motion.div>
        )}

        {/* 启动故事 */}
        {isDirector && allApproved && story.status === 'recruiting' && !isDemo && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-4">
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleStartStory} disabled={starting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {starting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Play className="w-5 h-5" />启动故事 · 开拍</>}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <p className="text-[11px] text-slate-600 text-center mt-2">所有演员已就位，点击启动进入对白实验室</p>
          </motion.div>
        )}

        {/* 范例提示 */}
        {isDemo && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-4">
            <div className="p-4 rounded-2xl bg-blue-500/[0.04] border border-blue-500/15">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">系统范例剧本</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                这是一个系统提供的范例剧本，展示了群像共创的完整结构。每个角色都有<strong>隐藏秘密</strong>和<strong>核心动机</strong>，点击"查看秘密"可以体验完整的人物设定。
                真正的创作从"发起故事"开始，你也可以创建属于自己的剧本。
              </p>
              <div className="flex gap-2">
                <button onClick={() => router.push('/story-hall')}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-colors">
                  返回剧场
                </button>
                <button onClick={() => router.push('/story-hall')}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-xs font-medium flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />发起我的剧本
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 进入对白室 */}
        {story.status === 'ongoing' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-6">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(`/story-hall/${storyId}/room`)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-sm font-bold shadow-lg shadow-xh-gold/20 hover:shadow-xl hover:shadow-xh-gold/30 transition-all flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />进入对白实验室<ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* 锁定提示 */}
        {story.status === 'recruiting' && !allApproved && (
          <div className="px-4 pb-6">
            <div className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800/30 border border-slate-700/20">
              <Lock className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-slate-500">所有演员审核通过后，导演可启动故事</span>
            </div>
          </div>
        )}
      </div>

      {claimingRole && (
        <ClaimRoleModal
          roleName={claimingRole.name}
          roleDescription={claimingRole.description}
          storyId={storyId}
          roleId={claimingRole.id}
          onClose={() => setClaimingRole(null)}
          onClaimed={loadStory}
        />
      )}
    </div>
  );
}
