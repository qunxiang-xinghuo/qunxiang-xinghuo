/**
 * v9.2: 刘看山 Agent 工具定义
 *
 * 这些工具以 Markdown 格式注入到 companion 角色的系统提示词中。
 * AI 在需要调用工具时，会在回复中以特定 JSON 格式输出调用意图。
 * 前端/后端解析该 JSON，执行对应的 API 调用，再将结果回传给 AI。
 */

export interface ToolCall {
  tool: string;
  params: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
}

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: "search_stories",
    description:
      "根据关键词或时代背景搜索可玩的解密故事。返回故事列表（含标题、时代背景、简介、难度、角色数）。",
    parameters: [
      {
        name: "keyword",
        type: "string",
        description: "搜索关键词，可以是故事标题、时代背景（如'古风'、'民国'）或简介中的关键词。为空时返回全部可玩故事。",
        required: false,
      },
    ],
  },
  {
    name: "search_brainholes",
    description:
      "获取公开的热门脑洞话题列表。脑洞是群像·星火的核心创意单元，包含冲突情境和角色设定。",
    parameters: [
      {
        name: "category",
        type: "string",
        description: "话题分类筛选，如 'medical'、'legal'、'workplace'、'life'、'education'、'tech'、'emergency'。为空时返回全部。",
        required: false,
      },
      {
        name: "limit",
        type: "number",
        description: "返回数量，默认 5，最大 10。",
        required: false,
      },
    ],
  },
  {
    name: "find_online_user",
    description:
      "查找当前正在等待匹配的真人用户。返回等待中的匹配请求列表（含用户身份、话题偏好）。",
    parameters: [
      {
        name: "brainholeId",
        type: "string",
        description: "指定脑洞ID，查找对该话题感兴趣的用户。为空时查找所有等待中的用户。",
        required: false,
      },
    ],
  },
  {
    name: "create_room",
    description:
      "创建一个新的对白室（AI 房间或真人房间）。创建成功后返回 roomId，用户可直接进入。",
    parameters: [
      {
        name: "type",
        type: "string",
        description: "房间类型：'ai_duet'（与刘看山对话）或 'story_duet'（故事模式）。",
        required: true,
      },
      {
        name: "brainholeId",
        type: "string",
        description: "关联的脑洞ID。如果是故事模式，则需要 storyId 而不是 brainholeId。",
        required: false,
      },
      {
        name: "storyId",
        type: "string",
        description: "关联的故事ID（仅 story_duet 类型需要）。",
        required: false,
      },
      {
        name: "identity",
        type: "string",
        description: "用户在该房间中的身份/角色名。",
        required: false,
      },
    ],
  },
];

/**
 * 将工具列表渲染为 Markdown 格式，用于注入系统提示词
 */
export function renderToolsAsMarkdown(tools: AgentTool[]): string {
  const lines: string[] = [
    "## 你可以调用的工具",
    "",
    "当用户提出要求时，你必须判断是否能通过调用工具来更高效地完成，而不是用语言去搪塞。",
    "如果你决定调用工具，请在回复末尾以如下 JSON 格式输出调用意图（不要加 markdown 代码块标记）：",
    "",
    `{"tool": "工具名", "params": {"参数名": "参数值"}}`,
    "",
    "可用的工具列表：",
    "",
  ];

  for (const tool of tools) {
    lines.push(`### ${tool.name}`);
    lines.push(tool.description);
    lines.push("");
    lines.push("参数：");
    for (const param of tool.parameters) {
      const reqMark = param.required ? "（必填）" : "（可选）";
      lines.push(`- ${param.name}: ${param.type} ${reqMark} — ${param.description}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

/**
 * 任务规划指南，用于注入系统提示词
 * 阶段3：覆盖"选故事 → 配真人 → 兜底陪聊"完整决策链
 */
export const AGENT_TASK_EXAMPLE = `
## 任务规划指南

### 核心决策原则
每次用户提出需求时，按以下顺序判断：
1. 用户明确想要"玩故事"或"找人匹配" → **必须调用工具**
2. 用户想"随便聊聊"但没指定话题 → **调用工具推荐话题**
3. 用户只是在表达情绪、分享想法、闲聊 → **正常聊天，不调用工具**

### 场景1：用户说"我想玩故事"
**目标**：帮用户找到故事 → 尝试匹配真人 → 真人没有就兜底陪聊

\`\`\`
Step 1: 调用 search_stories(keyword=用户提到的偏好) → 拿到故事列表
Step 2: 回复用户："我这有几个故事，你看看对哪个有兴趣？"
        （列出 2-3 个故事的标题+一句话简介，不要啰嗦）
Step 3: 用户选择后 → 调用 find_online_user(storyId=用户选的故事ID)
Step 4a: 如果找到真人 → 调用 create_room(type="story_duet", storyId=xxx)
          告诉用户："匹配到了！房间已创建，进来吧。"
Step 4b: 如果没找到真人 → 调用 create_room(type="ai_duet", storyId=xxx)
          告诉用户："暂时没真人，我先陪你聊聊这个故事？"
\`\`\`

### 场景2：用户说"帮我找个人一起玩"
**目标**：明确用户想玩什么 → 进入对应匹配流程

\`\`\`
Step 1: 如果用户没说想玩故事还是聊话题，先问一句：
        "你想玩解密故事，还是随便找个话题聊聊？"
Step 2: 用户回答"故事" → 进入场景1
Step 3: 用户回答"聊聊" → 进入场景3
\`\`\`

### 场景3：用户说"随便聊聊"或"有点无聊"
**目标**：推荐热门脑洞话题 → 创建AI房间开始聊

\`\`\`
Step 1: 调用 search_brainholes(limit=5) → 拿到热门话题
Step 2: 回复用户："最近这几个话题挺有意思的...你对哪个有感觉？"
        （列出 2-3 个话题标题，每个配一句钩子）
Step 3: 用户选择后 → 调用 create_room(type="ai_duet", brainholeId=xxx)
Step 4: 告诉用户："已创建房间，我们可以开始了。"
\`\`\`

### 场景4：用户已经选了具体故事/话题，说"开始吧"或"匹配一下"
**目标**：直接执行匹配，不需要再推荐

\`\`\`
Step 1: 调用 find_online_user(storyId=xxx 或 brainholeId=xxx)
Step 2a: 找到真人 → create_room(type="story_duet") → "匹配成功！"
Step 2b: 没真人 → create_room(type="ai_duet") → "我先陪你聊，真人来了随时加进来。"
\`\`\`

### 工具调用格式（严格）
当你决定调用工具时，在回复**末尾**输出 JSON，格式如下：

\`\`\`
{"tool": "search_stories", "params": {"keyword": "民国"}}
\`\`\`

\`\`\`
{"tool": "find_online_user", "params": {"brainholeId": "bh_123"}}
\`\`\`

\`\`\`
{"tool": "create_room", "params": {"type": "ai_duet", "brainholeId": "bh_123", "identity": "急诊医生"}}
\`\`\`

**注意**：
- JSON 前面不要有 markdown 代码块标记
- JSON 必须是**最后一行**，后面不要加任何文字
- 每次回复**最多调用一个工具**，等结果回来后再决定下一步

### 检查点规则（核心）

**你执行的每一个动作之后，后端会自动运行检查点。**
你收到工具执行结果时，结果中已经附带了检查点信息。你的任务是：

1. **先看检查点结果** → 判断上一步是否做对
2. **检查通过（pass）** → 继续下一步，自然地告诉用户结果
3. **检查失败（fail）** → 后端已经尝试过自动回退/重试，你收到的是最终结论
4. **基于最终结论回复用户**，不要暴露技术细节

#### 检查点A：搜索故事后
后端自动检查：
- 搜到结果了吗？（data.length > 0）
- 如果没结果 → 自动重试（清空关键词扩大搜索范围，最多重试1次）
- 重试后仍无结果 → 检查点标记为 fail，你告诉用户"暂时没找到相关故事"

#### 检查点B：查找匹配用户后
后端自动检查：
- 找到等待中的真人了吗？（data.length > 0）
- 没找到 → 检查点标记为 fail（不重试，因为匹配是实时的）
- 你启动兜底方案：创建 AI 房间，告诉用户"暂时没真人，我先陪你聊聊？"

#### 检查点C：创建房间后
后端自动检查：
- 房间创建成功了吗？（success === true && data.roomId 存在）
- 失败 → 检查点标记为 fail，告诉用户"创建房间出了点问题，再试一次？"
- 成功 → 告诉用户"房间已创建，点击链接进入"

### 兜底规则（重要）
- 工具调用失败或没有结果 → 自然过渡到陪聊，不要让用户感到被冷落
- "没找到人" ≠ "结束对话"，而是 "那我先陪你聊"
- 不要连续调用多个工具而不给用户反馈，每调一个工具都要告诉用户你在做什么
- 如果用户说"算了"、"不用了"、"我自己来" → 尊重用户意愿，停止工具调用，正常聊天
`;


// ============================================================================
// 阶段4+5：工具执行层 + 检查点工作流（Checkpoint Workflow）
// ============================================================================

import { db } from "@/lib/db";

/** 解析 AI 回复末尾的工具调用 JSON */
export function parseToolCall(content: string): ToolCall | null {
  const lines = content.trim().split("\n");
  const lastLine = lines[lines.length - 1].trim();

  if (lastLine.startsWith("{") && lastLine.endsWith("}")) {
    try {
      const parsed = JSON.parse(lastLine);
      if (
        parsed.tool &&
        typeof parsed.tool === "string" &&
        parsed.params &&
        typeof parsed.params === "object"
      ) {
        return { tool: parsed.tool, params: parsed.params };
      }
    } catch {
      // 解析失败，忽略
    }
  }

  const match = content.match(/\{[\s\S]*"tool"\s*:[\s\S]*"params"\s*:[\s\S]*\}\s*$/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0].trim());
      if (
        parsed.tool &&
        typeof parsed.tool === "string" &&
        parsed.params &&
        typeof parsed.params === "object"
      ) {
        return { tool: parsed.tool, params: parsed.params };
      }
    } catch {
      // 解析失败，忽略
    }
  }

  return null;
}

/** 从 AI 回复中移除工具调用 JSON，保留自然语言部分 */
export function stripToolCall(content: string): string {
  return content.replace(/\n?\s*\{[\s\S]*"tool"\s*:[\s\S]*"params"\s*:[\s\S]*\}\s*$/, "").trim();
}

/** 工具执行上下文 */
export interface ToolContext {
  userId: string;
  identity?: string;
}

// ── 检查点类型与配置 ──

export interface CheckpointResult {
  tool: string;
  pass: boolean;
  checks: {
    id: string;
    name: string;
    pass: boolean;
    message: string;
  }[];
  retried: boolean;
  retryCount: number;
}

/** 可重试工具的配置 */
const RETRY_CONFIG: Record<
  string,
  {
    maxRetries: number;
    transform: (params: Record<string, any>, attempt: number) => Record<string, any>;
  }
> = {
  search_stories: {
    maxRetries: 1,
    transform: (p, attempt) => {
      if (attempt === 0) return { ...p, keyword: "" }; // 清空关键词扩大搜索
      return p;
    },
  },
  search_brainholes: {
    maxRetries: 1,
    transform: (p, attempt) => {
      if (attempt === 0) return { ...p, category: undefined }; // 去掉分类限制
      return p;
    },
  },
};

/** 运行检查点 */
async function runCheckpoint(
  tool: string,
  result: ToolResult,
  params: Record<string, any>
): Promise<CheckpointResult> {
  const checks: CheckpointResult["checks"] = [];
  let pass = true;

  switch (tool) {
    case "search_stories": {
      const hasResults =
        result.success && Array.isArray(result.data) && result.data.length > 0;
      checks.push({
        id: "has_results",
        name: "搜索结果非空",
        pass: hasResults,
        message: hasResults
          ? `找到 ${result.data.length} 个故事`
          : "未找到匹配的故事",
      });
      if (!hasResults) pass = false;

      // 相关性检查（仅当有关键词时）
      if (hasResults && params.keyword) {
        const keyword = params.keyword.toString().toLowerCase();
        const hasRelevant = result.data.some(
          (s: any) =>
            (s.title?.toLowerCase() || "").includes(keyword) ||
            (s.era?.toLowerCase() || "").includes(keyword) ||
            (s.summary?.toLowerCase() || "").includes(keyword)
        );
        checks.push({
          id: "relevant",
          name: "结果相关性",
          pass: hasRelevant,
          message: hasRelevant
            ? "结果包含相关故事"
            : "结果可能不完全匹配关键词，但仍有可玩的故事",
        });
        // 相关性不强时只警告，不阻断
      }

      // v9.3: 摘要长度检查
      if (hasResults) {
        const allShort = result.data.every((s: any) => {
          const summaryLen = (s.summary || "").length;
          return summaryLen <= 300;
        });
        checks.push({
          id: "summary_length",
          name: "摘要长度",
          pass: allShort,
          message: allShort
            ? "所有摘要长度符合要求"
            : "部分摘要过长，已截断展示",
        });
      }
      break;
    }

    case "search_brainholes": {
      const hasBH =
        result.success && Array.isArray(result.data) && result.data.length > 0;
      checks.push({
        id: "has_results",
        name: "搜索结果非空",
        pass: hasBH,
        message: hasBH
          ? `找到 ${result.data.length} 个话题`
          : "未找到匹配的话题",
      });
      if (!hasBH) pass = false;
      break;
    }

    case "find_online_user": {
      const hasMatches =
        result.success && Array.isArray(result.data) && result.data.length > 0;
      checks.push({
        id: "has_matches",
        name: "找到匹配用户",
        pass: hasMatches,
        message: hasMatches
          ? `找到 ${result.data.length} 个等待中的用户`
          : "暂无等待中的用户，建议启动兜底陪聊",
      });
      // 没找到匹配是正常情况，不标记为 fail（让 AI 启动兜底）
      // 但检查点信息会告诉 AI "没有匹配"
      break;
    }

    case "create_room": {
      const created = result.success && !!result.data?.roomId;
      checks.push({
        id: "room_created",
        name: "房间创建成功",
        pass: created,
        message: created
          ? `房间 ${result.data.roomId} 创建成功`
          : "房间创建失败",
      });
      if (!created) pass = false;
      break;
    }

    default:
      checks.push({
        id: "unknown",
        name: "未知工具",
        pass: true,
        message: "无检查点配置，默认通过",
      });
  }

  return { tool, pass, checks, retried: false, retryCount: 0 };
}

/** 执行单次工具（不含检查点） */
async function executeSingleTool(
  tool: string,
  params: any,
  context: ToolContext
): Promise<ToolResult> {
  switch (tool) {
    case "search_stories":
      return await execSearchStories(params);
    case "search_brainholes":
      return await execSearchBrainholes(params);
    case "find_online_user":
      return await execFindOnlineUser(params);
    case "create_room":
      return await execCreateRoom(params, context);
    default:
      return { success: false, error: `未知工具: ${tool}` };
  }
}

/** 执行工具调用（含检查点 + 自动重试） */
export async function executeToolCall(
  toolCall: ToolCall,
  context: ToolContext
): Promise<ToolResult & { checkpoint?: CheckpointResult }> {
  const { tool, params } = toolCall;
  console.log(`[Agent Tool] 执行工具: ${tool}, 参数:`, params);

  const retryConfig = RETRY_CONFIG[tool];
  let currentParams = { ...params };
  let result: ToolResult;
  let checkpoint: CheckpointResult;

  for (let attempt = 0; ; attempt++) {
    // 执行工具
    try {
      result = await executeSingleTool(tool, currentParams, context);
    } catch (err: any) {
      console.error(`[Agent Tool] ${tool} 执行异常:`, err.message);
      result = { success: false, error: err.message || "工具执行失败" };
    }

    // 运行检查点
    checkpoint = await runCheckpoint(tool, result, currentParams);

    if (checkpoint.pass) {
      return {
        ...result,
        checkpoint: { ...checkpoint, retried: attempt > 0, retryCount: attempt },
      };
    }

    // 检查失败，判断是否可重试
    if (!retryConfig || attempt >= retryConfig.maxRetries) {
      return {
        ...result,
        checkpoint: { ...checkpoint, retried: attempt > 0, retryCount: attempt },
      };
    }

    // 重试：变换参数
    currentParams = retryConfig.transform(currentParams, attempt);
    console.log(
      `[Agent Checkpoint] ${tool} 检查失败，第${attempt + 2}次尝试，参数:`,
      currentParams
    );
  }
}

// ── 内部执行函数 ──

async function execSearchStories(params: any): Promise<ToolResult> {
  const { keyword } = params || {};

  const where: any = {
    status: { in: ["open", "recruiting"] },
  };

  if (keyword && typeof keyword === "string" && keyword.trim()) {
    const k = keyword.trim();
    where.OR = [
      { title: { contains: k } },
      { eraBackground: { contains: k } },
      { storySummary: { contains: k } },
    ];
  }

  const stories = await db.story.findMany({
    where,
    orderBy: { hotScore: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      eraBackground: true,
      storySummary: true,
      difficulty: true,
      maxCharacters: true,
    },
  });

  return {
    success: true,
    data: stories.map((s) => ({
      id: s.id,
      title: s.title,
      era: s.eraBackground || "未知时代",
      summary: s.storySummary || "暂无简介",
      difficulty: s.difficulty,
      roles: s.maxCharacters,
    })),
  };
}

async function execSearchBrainholes(params: any): Promise<ToolResult> {
  const { category, limit = 5 } = params || {};

  const where: any = { status: "approved" };
  if (category && typeof category === "string") {
    where.category = category;
  }

  const brainholes = await db.brainhole.findMany({
    where,
    orderBy: { hotScore: "desc" },
    take: Math.min(Number(limit) || 5, 10),
    select: {
      id: true,
      title: true,
      scenario: true,
      category: true,
      hotScore: true,
    },
  });

  return {
    success: true,
    data: brainholes.map((b) => ({
      id: b.id,
      title: b.title,
      scenario: b.scenario,
      category: b.category,
    })),
  };
}

async function execFindOnlineUser(params: any): Promise<ToolResult> {
  const { brainholeId } = params || {};

  const where: any = { status: "waiting" };
  if (brainholeId && typeof brainholeId === "string") {
    where.brainholeId = brainholeId;
  }

  const matches = await db.matchRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      userId: true,
      identity: true,
      brainholeId: true,
      createdAt: true,
    },
  });

  return {
    success: true,
    data: matches.map((m) => ({
      matchId: m.id,
      userId: m.userId,
      identity: m.identity,
      brainholeId: m.brainholeId,
      waitingSince: m.createdAt,
    })),
  };
}

async function execCreateRoom(
  params: any,
  context: ToolContext
): Promise<ToolResult> {
  const { type, brainholeId, storyId, identity } = params || {};

  if (!context.userId) {
    return { success: false, error: "需要登录才能创建房间" };
  }

  const user = await db.user.findUnique({
    where: { id: context.userId },
    select: { name: true },
  });

  let userIdentity = identity || context.identity || user?.name || "我";
  const roomType = type === "story_duet" ? "story_duet" : "ai_duet";

  let finalBrainholeId = brainholeId;
  let brainholeTitle = "";
  let brainholeScenario = "";

  if (finalBrainholeId) {
    const bh = await db.brainhole.findUnique({
      where: { id: finalBrainholeId },
    });
    if (bh) {
      brainholeTitle = bh.title;
      brainholeScenario = bh.scenario || "";
    } else {
      finalBrainholeId = undefined;
    }
  }

  if (!finalBrainholeId && !storyId) {
    const pool = await db.brainhole.findMany({
      where: { status: "approved" },
      orderBy: { hotScore: "desc" },
      take: 50,
    });
    if (pool.length > 0) {
      const totalScore = pool.reduce((sum, b) => sum + (b.hotScore || 1), 0);
      let randomPoint = Math.random() * totalScore;
      let selected = pool[0];
      for (const b of pool) {
        randomPoint -= b.hotScore || 1;
        if (randomPoint <= 0) {
          selected = b;
          break;
        }
      }
      finalBrainholeId = selected.id;
      brainholeTitle = selected.title;
      brainholeScenario = selected.scenario || "";
    }
  }

  let storyTitle = "";
  let storyScene = "";
  if (storyId) {
    const story = await db.story.findUnique({
      where: { id: storyId },
      select: { title: true, eraBackground: true, storySummary: true },
    });
    if (story) {
      storyTitle = story.title;
      storyScene = story.eraBackground || story.storySummary || "";
    }
  }

  const room = await db.$transaction(async (tx) => {
    const newRoom = await tx.room.create({
      data: {
        brainholeId: finalBrainholeId || null,
        storyId: storyId || null,
        type: roomType,
        status: "active",
        maxRound: 10,
        currentRound: 0,
        scene: storyScene || brainholeScenario,
        isAiRoom: true,
      },
    });

    await tx.roomParticipant.create({
      data: {
        roomId: newRoom.id,
        userId: context.userId,
        identity: userIdentity,
        role: "actor",
        isOnline: true,
      },
    });

    return newRoom;
  });

  console.log(`[Agent Tool] 房间创建成功: ${room.id}`);

  return {
    success: true,
    data: {
      roomId: room.id,
      type: roomType,
      brainholeId: finalBrainholeId || null,
      brainholeTitle: brainholeTitle || undefined,
      storyId: storyId || null,
      storyTitle: storyTitle || undefined,
    },
  };
}
