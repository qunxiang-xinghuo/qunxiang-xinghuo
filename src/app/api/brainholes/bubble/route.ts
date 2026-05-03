import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { getHotList, zhihuSearch } from "@/lib/zhihu-dev-api";

// v6.0-fix: 稳定的fallback数据——每次使用相同的id，确保持久化
const STABLE_FALLBACK_DATA = [
  { id: "fb-medical-001", title: "急诊室里的道德困境", scenario: "凌晨2点，一位急诊科医生面对两个同时送达的病人：一个是酒驾肇事者，一个是被他撞伤的行人。血库只剩下最后一袋匹配型血，而两个病人都需要立即输血...", category: "medical", hotScore: 92 },
  { id: "fb-workplace-001", title: "裁员名单上的秘密", scenario: "公司年会前夜，HR总监发现裁员名单上有自己最好的朋友。更意外的是，朋友在名单确认栏签了字，似乎早已知情...", category: "workplace", hotScore: 88 },
  { id: "fb-life-001", title: "学区房背后的交易", scenario: "为了孩子的入学资格，一对夫妻决定假离婚。当一切办妥后，丈夫却有了新的恋情，妻子面临人财两空...", category: "life", hotScore: 85 },
  { id: "fb-medical-002", title: "网红医生的真实面", scenario: "一位医学科普大V在直播中承诺免费治疗罕见病患者。当真正的患者找上门时，他发现自己的团队根本不具备条件...", category: "medical", hotScore: 80 },
  { id: "fb-life-002", title: "拆迁办的最后一户", scenario: "旧城改造进入尾声，只剩下一户人家拒不搬迁。街道办的人发现，这户人家的老人在等一个40年前失散的亲人...", category: "life", hotScore: 78 },
  { id: "fb-education-001", title: "老师与学生的秘密", scenario: "一位初三班主任偶然发现班上最优秀的学生在深夜送外卖。当她家访时，看到了一个她无法想象的家庭...", category: "education", hotScore: 76 },
  { id: "fb-medical-003", title: "外卖骑手的双重身份", scenario: "一个外卖骑手在送餐时救了一位心脏骤停的老人。媒体报道后，人们发现他是某知名医学院的肄业生...", category: "medical", hotScore: 74 },
  { id: "fb-legal-001", title: "法庭上的亲情审判", scenario: "一位辩护律师发现自己的当事人竟是被拐卖了20年的亲妹妹。妹妹要求起诉的，是他们的养父母...", category: "legal", hotScore: 72 },
  { id: "fb-tech-001", title: "程序员与AI的对赌", scenario: "一位AI工程师发现自己的算法即将取代整个部门。老板提出一个对赌：如果他能在三个月内让AI出错，就保住所有人的工作...", category: "tech", hotScore: 70 },
  { id: "fb-education-002", title: "幼儿园里的真相", scenario: "一位幼儿园园长收到匿名举报，说某个班级存在体罚。当她调查时，发现施暴者和举报者有着意想不到的关联...", category: "education", hotScore: 68 },
  { id: "fb-emergency-001", title: "消防员的选择", scenario: "一栋高楼发生火灾，消防员只能先救一侧。A侧是一个独居老人，B侧是一个带着婴儿的年轻妈妈。时间只够救一边...", category: "emergency", hotScore: 66 },
  { id: "fb-medical-004", title: "心理咨询师的两难", scenario: "一位心理咨询师发现来访者的丈夫是自己的挚友。来访者透露的信息暗示，丈夫可能涉及一起未破的案件...", category: "medical", hotScore: 64 },
  { id: "fb-workplace-002", title: "记者与线人", scenario: "调查记者拿到了某企业污染环境的铁证，但线人是该企业老板的女儿。报道发表后，父女关系彻底破裂...", category: "workplace", hotScore: 62 },
  { id: "fb-medical-005", title: "护士的夜班", scenario: "ICU夜班护士发现一位临终患者的家属在偷偷减少老人的输液量。家属说，这是老人清醒时的再三恳求...", category: "medical", hotScore: 60 },
  { id: "fb-workplace-003", title: "创业者的对赌协议", scenario: "创业者与投资人签了对赌协议。眼看deadline临近，他发现唯一能完成对赌的方式，是牺牲团队里一名核心成员的利益...", category: "workplace", hotScore: 58 },
  { id: "fb-life-003", title: "全职妈妈的秘密", scenario: "一位全职妈妈在家长群里偶然发现，丈夫与另一位家长的聊天记录异常亲密。更令她震惊的是，那位家长的身份...", category: "life", hotScore: 56 },
  { id: "fb-life-004", title: "酒吧老板的客人", scenario: "酒吧老板发现一位常客每晚都在等一个不会出现的人。三个月后，那个人真的出现了，但身份让老板措手不及...", category: "life", hotScore: 54 },
  { id: "fb-life-005", title: "民宿里的命案", scenario: "民宿老板发现客人在房间里离世。警方调查时，老板突然想起三天前另一位客人曾提到过这个房间不干净...", category: "life", hotScore: 52 },
  { id: "fb-life-006", title: "社工的抉择", scenario: "社工在走访中发现一位独居老人被子女遗弃。当他联系子女时，发现老人年轻时也曾以同样的方式对待自己的父母...", category: "life", hotScore: 50 },
  { id: "fb-workplace-004", title: "产品经理的困境", scenario: "产品上线前夕，产品经理发现核心功能抄袭了竞品。但团队已经投入半年，投资人明天就要看demo...", category: "workplace", hotScore: 48 },
  { id: "fb-medical-006", title: "法医的线索", scenario: "法医在尸检中发现死者体内有罕见的毒药成分。追踪来源时，发现这种毒药只在一个封闭的实验室里才有...", category: "medical", hotScore: 46 },
  { id: "fb-life-007", title: "北漂程序员的抉择", scenario: "程序员终于攒够首付，却发现房东要涨租30%。更糟的是，他的roommate偷偷用他的名义贷了款...", category: "life", hotScore: 44 },
  { id: "fb-life-008", title: "退休教师的遗产", scenario: "退休教师去世后，遗嘱将房产留给了一个陌生人。子女调查后发现，这个陌生人竟是他们失散多年的手足...", category: "life", hotScore: 42 },
  { id: "fb-emergency-002", title: "急诊科的分诊", scenario: "急诊分诊台同时来了三个病人：一个心梗老人、一个孕妇、一个刀伤青年。只剩一台抢救设备...", category: "emergency", hotScore: 40 },
  { id: "fb-legal-002", title: "拆迁办主任的良心", scenario: "拆迁办主任发现补偿款被层层克扣，真正到居民手上的不到三成。他决定举报，却发现举报信会最先送到克扣者的桌上...", category: "legal", hotScore: 38 },
  { id: "fb-medical-007", title: "急诊护士的发现", scenario: "急诊护士发现一位交通事故受害者的伤情与描述不符。深入调查后，她揭开了一场精心策划的骗保骗局...", category: "medical", hotScore: 36 },
  { id: "fb-life-009", title: "社工的秘密", scenario: "社区社工发现自己帮助的对象竟是多年前伤害过自己家庭的人。面对对方的感谢和信任，她陷入了深深的矛盾...", category: "life", hotScore: 34 },
  { id: "fb-education-003", title: "初中班主任的抉择", scenario: "班主任发现班里两个学生分别来自一对正在闹离婚的夫妻。期中考试后，两个孩子同时要求换班...", category: "education", hotScore: 32 },
  { id: "fb-life-010", title: "酒吧老板的真相", scenario: "酒吧老板收留了一个失忆的流浪者。当流浪者恢复记忆时，他的第一句话是：你为什么要杀我？", category: "life", hotScore: 30 },
  { id: "fb-life-011", title: "民宿老板的发现", scenario: "民宿老板整理房间时，在床底发现一个密封的盒子。打开后，里面是一沓20年前的信，收信人是他自己...", category: "life", hotScore: 28 },
];

interface BubbleBrainhole {
  id: string;
  title: string;
  scenario: string;
  hotScore: number;
  category: string;
  source: string;
  difficulty: string;
  reactionCount: number;
  sparkCount: number;
  collectionCount: number;
}

/** v6.0: 将生成的数据持久化到数据库，返回稳定id的记录 */
async function persistBrainholes(items: BubbleBrainhole[]): Promise<BubbleBrainhole[]> {
  const persisted: BubbleBrainhole[] = [];
  for (const item of items) {
    try {
      const existing = await db.brainhole.findFirst({
        where: { title: item.title },
      });
      if (existing) {
        // 更新热度等字段
        await db.brainhole.update({
          where: { id: existing.id },
          data: {
            hotScore: Math.max(existing.hotScore, item.hotScore),
            updatedAt: new Date(),
          },
        });
        persisted.push({
          ...item,
          id: existing.id,
          reactionCount: existing.reactionCount,
          sparkCount: existing.sparkCount,
          collectionCount: existing.collectionCount,
        });
      } else {
        // 创建新记录，使用cuid()获得稳定id
        const created = await db.brainhole.create({
          data: {
            title: item.title,
            scenario: item.scenario,
            hotScore: item.hotScore,
            category: item.category,
            source: item.source,
            difficulty: item.difficulty,
            status: "approved",
            recencyBoost: true,
          },
        });
        persisted.push({
          ...item,
          id: created.id,
          reactionCount: 0,
          sparkCount: 0,
          collectionCount: 0,
        });
      }
    } catch (err) {
      console.error("[Bubble] Persist failed:", err);
      // 持久化失败时，返回原始item（但这种情况极少）
      persisted.push(item);
    }
  }
  return persisted;
}

async function generateDeepSeekBrainholes(topics: string[]): Promise<BubbleBrainhole[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || topics.length === 0) return [];
  try {
    const systemPrompt = `你是一个创意写作助手，擅长将社会热点话题转化为具有冲突性和故事性的角色扮演脑洞情境。
每个脑洞需要包含：
1. 一个吸引人的标题（15-30字）
2. 一个具体的情境描述（50-100字），包含时间、地点、人物冲突
要求：情境要有真实感和代入感，包含明确的角色身份和立场冲突，适合双人角色扮演对话，只输出JSON数组`;

    const userPrompt = `基于以下热门话题，生成10个角色扮演脑洞情境：
${topics.slice(0, 5).map((t, i) => `${i + 1}. ${t}`).join("\n")}
请输出以下格式的JSON数组（不要包含markdown代码块标记）：
[{ "title": "脑洞标题", "scenario": "情境描述", "category": "general" }, ...]`;

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.9, max_tokens: 2000 }),
    });
    if (!res.ok) { console.error("[Bubble] DeepSeek API error:", res.status); return []; }
    const result = await res.json();
    const content = result.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const items = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(items)) return [];
    const raw = items.filter((item: any) => item.title && item.scenario).map((item: any) => ({
      id: `temp-ds-${Date.now()}`, title: String(item.title).slice(0, 60), scenario: String(item.scenario).slice(0, 300),
      hotScore: 70 + Math.floor(Math.random() * 25), category: item.category || "general", source: "deepseek", difficulty: "medium",
      reactionCount: 0, sparkCount: 0, collectionCount: 0,
    }));
    // 持久化到数据库
    return await persistBrainholes(raw);
  } catch (err) { console.error("[Bubble] DeepSeek generation failed:", err); return []; }
}

async function fetchZhihuHotBrainholes(): Promise<BubbleBrainhole[]> {
  try {
    const result = await getHotList(15);
    if (result.Code !== 0 || !result.Data?.Items) return [];
    const raw = result.Data.Items.map((item, index) => ({
      id: `temp-zh-${Date.now()}-${index}`, title: item.Title.slice(0, 60),
      scenario: item.Summary ? item.Summary.slice(0, 300) : item.Title.slice(0, 300),
      hotScore: 85 + Math.floor(Math.random() * 15), category: "zhihu_hot", source: "zhihu_hotlist", difficulty: "medium",
      reactionCount: Math.floor(Math.random() * 50), sparkCount: Math.floor(Math.random() * 20), collectionCount: Math.floor(Math.random() * 10),
    }));
    return await persistBrainholes(raw);
  } catch (err) { console.error("[Bubble] Zhihu hot list failed:", err); return []; }
}

async function fetchZhihuSearchBrainholes(queries: string[]): Promise<BubbleBrainhole[]> {
  const brainholes: BubbleBrainhole[] = [];
  for (let i = 0; i < Math.min(queries.length, 3); i++) {
    try {
      const result = await zhihuSearch(queries[i], 5);
      if (result.Code !== 0 || !result.Data?.Items) continue;
      const raw = result.Data.Items.map((item, idx) => ({
        id: `temp-zs-${Date.now()}-${i}-${idx}`, title: item.Title.slice(0, 60),
        scenario: item.ContentText ? item.ContentText.slice(0, 300) : item.Title.slice(0, 300),
        hotScore: 50 + Math.floor(Math.random() * 35), category: "general", source: "zhihu_search", difficulty: "medium",
        reactionCount: item.CommentCount || 0, sparkCount: Math.floor(item.VoteUpCount / 10) || 0, collectionCount: 0,
      }));
      const persisted = await persistBrainholes(raw);
      brainholes.push(...persisted);
    } catch (err) { console.error(`[Bubble] Zhihu search failed:`, err); }
  }
  return brainholes;
}

async function getStableFallbackBrainholes(count: number): Promise<BubbleBrainhole[]> {
  // v6.0: 使用稳定的fallback数据，先确保都保存到数据库
  const raw = STABLE_FALLBACK_DATA.slice(0, count).map(item => ({
    id: item.id,
    title: item.title,
    scenario: item.scenario,
    hotScore: item.hotScore,
    category: item.category,
    source: "fallback",
    difficulty: "medium",
    reactionCount: 0,
    sparkCount: 0,
    collectionCount: 0,
  }));
  return await persistBrainholes(raw);
}

function mergeAndDeduplicate(zhihuHot: BubbleBrainhole[], zhihuSearch: BubbleBrainhole[], deepseek: BubbleBrainhole[], fallback: BubbleBrainhole[]): BubbleBrainhole[] {
  const seen = new Set<string>();
  const result: BubbleBrainhole[] = [];
  const all = [...zhihuHot, ...zhihuSearch, ...deepseek, ...fallback];
  for (const item of all) {
    const key = item.title.slice(0, 20);
    if (!seen.has(key)) { seen.add(key); result.push(item); }
    if (result.length >= 30) break;
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 30);
    const refresh = searchParams.get("refresh") === "true";

    // 1. 优先从数据库获取已有的approved brainhole（稳定id）
    const dbBrainholes = await db.brainhole.findMany({
      where: { status: "approved" },
      orderBy: { hotScore: "desc" },
      take: 50,
    });

    // 如果数据库中有足够的数据，直接返回（确保所有id都是稳定的）
    if (!refresh && dbBrainholes.length >= limit) {
      console.log(`[Bubble] Returning ${dbBrainholes.length} stable brainholes from DB`);
      return NextResponse.json(apiResponse({ 
        brainholes: dbBrainholes.slice(0, limit), 
        total: dbBrainholes.length, 
        source: "db_stable" 
      }));
    }

    // 2. 从三渠道聚合新数据（并行请求，任一失败不影响其他）
    let zhihuHot: BubbleBrainhole[] = [];
    let deepseekBrainholes: BubbleBrainhole[] = [];
    try { zhihuHot = await fetchZhihuHotBrainholes(); } catch (e) { console.error("[Bubble] zhihuHot failed:", e); }
    try {
      const hotResult = await getHotList(10);
      if (hotResult.Code === 0 && hotResult.Data?.Items) {
        const topics = hotResult.Data.Items.map((i: any) => i.Title);
        deepseekBrainholes = await generateDeepSeekBrainholes(topics);
      }
    } catch (e) { console.error("[Bubble] deepseek failed:", e); }

    // 3. 知乎搜索
    const searchQueries = zhihuHot.slice(0, 3).map((h) => h.title);
    let zhihuSearch: BubbleBrainhole[] = [];
    try { zhihuSearch = await fetchZhihuSearchBrainholes(searchQueries); } catch (e) { console.error("[Bubble] zhihuSearch failed:", e); }

    // 4. 如果API数据不足，用fallback保底（稳定id）
    const apiCount = zhihuHot.length + zhihuSearch.length + deepseekBrainholes.length;
    const fallbackCount = Math.max(0, limit - apiCount);
    const fallback = await getStableFallbackBrainholes(Math.max(fallbackCount, limit));

    // 5. 合并去重
    const merged = mergeAndDeduplicate(zhihuHot, zhihuSearch, deepseekBrainholes, fallback);
    const final = merged.slice(0, limit);

    console.log(`[Bubble] Generated ${final.length} bubbles with stable IDs: zhihuHot=${zhihuHot.length}, search=${zhihuSearch.length}, deepseek=${deepseekBrainholes.length}, fallback=${fallback.length}`);

    return NextResponse.json(apiResponse({ brainholes: final, total: final.length, source: "fresh" }));
  } catch (error) {
    console.error("[Bubble] Aggregate API error:", error);
    // 最终保底：返回数据库中已有的稳定数据
    const dbFallback = await db.brainhole.findMany({
      where: { status: "approved" },
      orderBy: { hotScore: "desc" },
      take: 20,
    });
    return NextResponse.json(apiResponse({ brainholes: dbFallback, total: dbFallback.length, source: "db_fallback" }));
  }
}
