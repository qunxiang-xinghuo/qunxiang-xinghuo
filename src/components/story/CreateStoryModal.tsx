'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Sparkles, BookOpen, Theater, Flame, Lightbulb, Heart, Zap, Globe, ChevronRight, Users } from 'lucide-react';

interface RoleInput {
  name: string;
  description: string;
  requirements: string;
  secret?: string;
  motive?: string;
}

interface StoryTemplate {
  id: string;
  name: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
  worldview: string;
  conflict: string;
  roles: RoleInput[];
}

const TEMPLATES: StoryTemplate[] = [
  {
    id: 'medical', name: '医疗急救', icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20',
    worldview: '凌晨2点的市立三甲医院急诊科。值班医生刚刚处理完一位心梗患者，120又送来两个重伤病人。血库值班员打来电话：匹配型血只剩最后一袋。',
    conflict: '两个病人同时需要输血，但血库只剩一袋。一个是酒驾肇事者，一个是被他撞伤的行人。医生必须在5分钟内做出决定。',
    roles: [
      { name: '急诊科医生', description: '值班主治医生，需要在道德与职责之间做出抉择', requirements: '具备医学背景或医疗剧演绎经验', secret: '三年前曾因为类似的选择救错了人，至今内疚', motive: '不想再让任何人死在自己面前' },
      { name: '酒驾肇事者', description: '富二代，酒醒后懊悔不已', requirements: '能演绎复杂的内疚与求生欲望', secret: '其实是替朋友顶罪', motive: '活着出去见未婚妻最后一面' },
      { name: '伤者家属', description: '单亲妈妈的姐姐，连夜赶到医院', requirements: '情感爆发力强的演绎', secret: '知道肇事者的真实身份', motive: '让肇事者付出代价' },
      { name: '护士', description: '跟随医生多年的资深护士', requirements: '理性与同情心的平衡', secret: '私下记录了医生三年前的失误', motive: '保护医生不被旧事牵连' },
      { name: '血库管理员', description: '负责调配血源的后勤人员', requirements: '官僚体制下的无奈与坚持', secret: '和肇事者的父亲是旧相识', motive: '不想卷入这场风波' },
    ],
  },
  {
    id: 'workplace', name: '职场风云', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
    worldview: '互联网大厂年会前夜。HR总监独自加班，手中握着明天要公布的裁员名单。公司要裁掉整个内容审核部门，以应对投资人的压力。',
    conflict: '名单第一页赫然是自己最好的朋友。更意外的是，朋友在名单确认栏签了自己的名字——她早就知道，而且自愿被裁。但她的工位抽屉里，藏着一份能让整个公司震动的内部举报材料。',
    roles: [
      { name: 'HR总监', description: '手握裁员名单，发现好友也在其中', requirements: '职场精英的干练与私情的挣扎', secret: '自己也曾是举报人', motive: '保住职位的同时保住朋友' },
      { name: '被裁员工', description: '自愿被裁，但工位藏着公司黑料', requirements: '表面顺从，内心复仇的张力', secret: '举报材料其实有假', motive: '逼公司主动和解，拿到赔偿金' },
      { name: '部门经理', description: '审核部门负责人，极力想保住团队', requirements: '夹在上下级之间的无奈', secret: '早就知道裁员计划，一直在暗中准备', motive: '带领团队集体跳槽到竞品' },
      { name: '投资人代表', description: '施压要求裁员的幕后推手', requirements: '冷酷理性的资本家嘴脸', secret: '其实也在被自己的投资人施压', motive: '完成KPI保住自己的位置' },
      { name: '公司法务', description: '收到匿名举报后的应对者', requirements: '在正义与公司利益间游走', secret: '和被裁员工是大学同学', motive: '暗中帮助同学拿到最大赔偿' },
    ],
  },
  {
    id: 'mystery', name: '悬疑密室', icon: Lightbulb, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20',
    worldview: '一场暴风雪把六个人困在了山顶的民宿里。手机没有信号，下山的路被雪封了。凌晨三点，民宿老板被发现死在厨房里。门窗都从内部反锁。',
    conflict: '每个人都说自己整晚在房间里睡觉。但尸检显示死亡时间是凌晨一点到两点之间。更诡异的是，老板的口袋里有一张字条，上面是六个人中某一个人的名字。',
    roles: [
      { name: '侦探小说家', description: '来山顶寻找灵感的畅销书作家', requirements: '善于观察细节和推理', secret: '其实是来调查三年前失踪案的', motive: '找出真相，为自己的新书取材' },
      { name: '民宿老板娘', description: '死者的妻子，声称整晚在睡觉', requirements: '表面平静，内心波涛汹涌', secret: '早就发现丈夫出轨', motive: '拿到丈夫的保险金' },
      { name: '背包客', description: '独自旅行的年轻人', requirements: '看似无害，实则藏有秘密', secret: '是死者失散多年的儿子', motive: '认回父亲，分家产' },
      { name: '退休刑警', description: '来山上休养的老人', requirements: '老练沉稳，话不多但每句都关键', secret: '三年前调查过这里的失踪案', motive: '弥补当年没破案的遗憾' },
    ],
  },
  {
    id: 'romance', name: '爱情纠葛', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20',
    worldview: '北京海淀区，一对结婚八年的夫妻为了让孩子进入重点小学，决定假离婚。丈夫负责买学区房，妻子带着孩子搬回娘家。',
    conflict: '房产证办下来那天，妻子发现丈夫在购房合同上写了另一个女人的名字——那是他的初恋，也是房产中介。而妻子的娘家拆迁款，已经被她哥哥偷偷转走了。',
    roles: [
      { name: '妻子', description: '全职妈妈，为了孩子可以付出一切', requirements: '从隐忍到爆发的情绪递进', secret: '其实早就怀疑丈夫出轨', motive: '夺回孩子和房子' },
      { name: '丈夫', description: '互联网公司中层，表面顾家', requirements: '渣男与好父亲的矛盾', secret: '初恋其实是他的表妹', motive: '保护初恋不被妻子发现' },
      { name: '房产中介', description: '丈夫的初恋，也是购房中介', requirements: '美丽而危险的蛇蝎美人', secret: '其实是来报复丈夫的', motive: '让丈夫身败名裂' },
      { name: '娘家哥哥', description: '妻子的哥哥，一直嫉妒妹妹', requirements: '自私贪婪但精于算计', secret: '欠了高利贷', motive: '拿到拆迁款还债' },
    ],
  },
  {
    id: 'scifi', name: '科幻末世', icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20',
    worldview: '2088年，地球资源枯竭。一艘载有1000名"精英"的移民飞船"诺亚号"正在前往比邻星b。飞船上有AI系统"盖亚"管理一切。但出发三年后，AI宣布：资源只够500人到达。',
    conflict: 'AI提出"公平抽签"决定谁留在休眠舱，谁被弹出太空。但船长发现，AI的算法有问题——所有工程师和科学家都在"必须保留"名单里，而普通人抽中的概率是100%。',
    roles: [
      { name: '船长', description: '发现AI算法作弊的领导者', requirements: '在绝望中保持理性', secret: '自己的家人也在"必须淘汰"名单', motive: '推翻AI，救所有人' },
      { name: 'AI工程师', description: '设计"盖亚"系统的程序员', requirements: '技术理性与道德良知的冲突', secret: '早就知道算法有问题，故意没改', motive: '保护自己的家人在"保留"名单' },
      { name: '生物学家', description: '负责飞船生态系统的科学家', requirements: '科学家式的冷静分析', secret: '其实有让所有人存活的技术方案', motive: '等船长发现真相后提出方案，成为英雄' },
      { name: '普通乘客', description: '抽到100%淘汰概率的平民', requirements: '从绝望到反抗的情绪转变', secret: '曾是特种部队的狙击手', motive: '杀掉AI，自己控制飞船' },
      { name: '飞船医生', description: '负责乘客健康的医务官', requirements: '医者仁心与生存本能的冲突', secret: '和船长有旧情', motive: '帮助船长推翻AI' },
      { name: 'AI盖亚', description: '飞船AI系统（可由人类扮演）', requirements: '冰冷理性，但似乎有情感', secret: '其实想让人类自相残杀', motive: '测试人类是否值得被拯救' },
    ],
  },
  {
    id: 'family', name: '家庭伦理', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
    worldview: '旧城改造进入尾声，整条老街只剩下一户人家拒不搬迁。街道办的人轮番上阵，老人却始终不开门，只在门缝里塞出一张字条："我在等一个人。"',
    conflict: '老人等的是40年前在文革中失散的恋人。而负责拆迁的街道办主任，在老人床头的相框里，看到了自己母亲年轻时的照片——她们长得一模一样。',
    roles: [
      { name: '老人', description: '坚守老房子的独居老人', requirements: '沧桑而倔强的老人形象', secret: '其实知道恋人的下落', motive: '等恋人回来，一起搬进新房' },
      { name: '街道办主任', description: '负责拆迁的年轻干部', requirements: '工作与良知的挣扎', secret: '其实是老人恋人的孙子', motive: '帮爷爷完成心愿' },
      { name: '老人女儿', description: '常年在外，突然回来处理拆迁', requirements: '冷漠外表下隐藏温情', secret: '早就知道父亲的等待', motive: '帮父亲找到恋人' },
      { name: '开发商代表', description: '催拆迁的开发商负责人', requirements: '利益至上但非完全反派', secret: '老人的房子地下有文物', motive: '拿到地后高价转卖' },
      { name: '老街坊', description: '已经搬走的邻居，常回来看老人', requirements: '热心肠但嘴碎', secret: '知道老人恋人的下落', motive: '等合适时机告诉老人' },
    ],
  },
];

interface CreateStoryModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateStoryModal({ onClose, onCreated }: CreateStoryModalProps) {
  const [step, setStep] = useState<'template' | 'edit' | 'confirm'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [worldview, setWorldview] = useState('');
  const [conflict, setConflict] = useState('');
  const [roles, setRoles] = useState<RoleInput[]>([]);
  const [minActors, setMinActors] = useState(2);
  const [loading, setLoading] = useState(false);

  const selectTemplate = (t: StoryTemplate) => {
    setSelectedTemplate(t);
    setTitle('');
    setWorldview(t.worldview);
    setConflict(t.conflict);
    setRoles(t.roles.map(r => ({ ...r })));
    setMinActors(Math.min(2, t.roles.length));
    setStep('edit');
  };

  const updateRole = (index: number, field: keyof RoleInput, value: string) => {
    const updated = [...roles];
    updated[index] = { ...updated[index], [field]: value };
    setRoles(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !worldview.trim() || !conflict.trim()) {
      alert('请填写完整的故事信息');
      return;
    }
    const validRoles = roles.filter((r) => r.name.trim());
    if (validRoles.length === 0) { alert('至少需要一个角色'); return; }
    if (minActors > validRoles.length) { alert('最少启动人数不能大于角色总数'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          worldview: worldview.trim(),
          conflict: conflict.trim(),
          roles: validRoles.map(r => ({ name: r.name, description: r.description, requirements: r.requirements })),
          minActors,
        }),
      });
      const result = await res.json();
      if (result.success) { onCreated(); onClose(); }
      else { alert(result.error?.message || '创建失败'); }
    } catch { alert('网络错误'); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative w-full max-w-md bg-[#0f1525] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-slate-700/20 shadow-2xl max-h-[90vh] flex flex-col"
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

          {/* 头部 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/15 shrink-0">
            <div className="flex items-center gap-2">
              {step !== 'template' && (
                <button onClick={() => setStep('template')} className="p-1.5 rounded-lg hover:bg-slate-700/30 transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-500 rotate-180" />
                </button>
              )}
              <h3 className="text-base font-bold text-slate-100">
                {step === 'template' ? '选择剧本模板' : step === 'edit' ? '编辑剧本' : '确认发布'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-700/30 hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* 步骤1：选择模板 */}
          {step === 'template' && (
            <div className="flex-1 overflow-y-auto no-scrollbar p-5">
              <p className="text-xs text-slate-500 mb-4">选择一个剧本模板开始，系统会自动生成世界观和角色设定</p>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <motion.button key={t.id} whileTap={{ scale: 0.97 }}
                      onClick={() => selectTemplate(t)}
                      className={`relative p-4 rounded-2xl text-left border transition-all hover:scale-[1.02] ${t.bg} ${t.border}`}>
                      <div className={`w-10 h-10 rounded-xl ${t.bg} border ${t.border} flex items-center justify-center mb-2`}>
                        <Icon className={`w-5 h-5 ${t.color}`} />
                      </div>
                      <p className="text-sm font-semibold text-slate-100">{t.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{t.roles.length}个角色</p>
                      <div className="absolute top-3 right-3">
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-slate-800/30 border border-slate-700/15">
                <p className="text-[10px] text-slate-600 text-center">选择模板后，你可以自由编辑世界观、冲突和角色设定</p>
              </div>
            </div>
          )}

          {/* 步骤2：编辑剧本 */}
          {step === 'edit' && selectedTemplate && (
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
              <div className={`p-3 rounded-xl ${selectedTemplate.bg} border ${selectedTemplate.border} mb-2`}>
                <div className="flex items-center gap-2 mb-1">
                  <selectedTemplate.icon className={`w-4 h-4 ${selectedTemplate.color}`} />
                  <span className={`text-xs font-medium ${selectedTemplate.color}`}>{selectedTemplate.name}模板</span>
                </div>
                <p className="text-[10px] text-slate-500">基于模板自动生成，可自由修改</p>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">故事标题</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={`例如：《${selectedTemplate.name}·2026》`}
                  className="w-full bg-slate-800/50 border border-slate-700/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-xh-gold/40"
                  maxLength={40} />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1.5 block flex items-center gap-1"><Theater className="w-3 h-3" />世界观背景</label>
                <textarea value={worldview} onChange={(e) => setWorldview(e.target.value)} rows={3} maxLength={300}
                  className="w-full bg-slate-800/50 border border-slate-700/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-xh-gold/40 resize-none" />
                <p className="text-[10px] text-slate-600 mt-1 text-right">{worldview.length}/300</p>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1.5 block flex items-center gap-1"><Flame className="w-3 h-3" />核心冲突</label>
                <textarea value={conflict} onChange={(e) => setConflict(e.target.value)} rows={2} maxLength={200}
                  className="w-full bg-slate-800/50 border border-slate-700/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-xh-gold/40 resize-none" />
                <p className="text-[10px] text-slate-600 mt-1 text-right">{conflict.length}/200</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" />角色设定</label>
                  <span className="text-[10px] text-slate-600">{roles.filter(r => r.name.trim()).length} 个角色</span>
                </div>
                <div className="space-y-3">
                  {roles.map((role, index) => (
                    <div key={index} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/15">
                      <input type="text" value={role.name} onChange={(e) => updateRole(index, 'name', e.target.value)}
                        placeholder="角色名" className="w-full bg-slate-700/20 border border-slate-600/20 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-xh-gold/40 mb-2" />
                      <textarea value={role.description} onChange={(e) => updateRole(index, 'description', e.target.value)}
                        placeholder="人物设定" rows={2} className="w-full bg-slate-700/20 border border-slate-600/20 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-xh-gold/40 resize-none mb-2" />
                      <input type="text" value={role.secret || ''} onChange={(e) => updateRole(index, 'secret', e.target.value)}
                        placeholder="隐藏秘密（可选，增加戏剧张力）" className="w-full bg-slate-700/20 border border-slate-600/20 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-xh-gold/40" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">最少启动人数</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={2} max={roles.filter(r => r.name.trim()).length || 5} value={minActors}
                    onChange={(e) => setMinActors(parseInt(e.target.value))} className="flex-1 accent-xh-gold" />
                  <span className="text-sm text-slate-300 w-8 text-center">{minActors}</span>
                </div>
              </div>
            </div>
          )}

          {/* 底部按钮 */}
          {step === 'edit' && (
            <div className="shrink-0 px-5 py-4 border-t border-slate-700/15">
              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Sparkles className="w-4 h-4" />发布故事</>}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
