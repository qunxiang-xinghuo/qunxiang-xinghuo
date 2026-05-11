/**
 * v9.2: 刘看山 Agent 工具定义
 *
 * 这些工具以 Markdown 格式注入到 companion 角色的系统提示词中。
 * AI 在需要调用工具时，会在回复中以特定 JSON 格式输出调用意图。
 * 前端/后端解析该 JSON，执行对应的 API 调用，再将结果回传给 AI。
 */

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

### 兜底规则（重要）
- 工具调用失败或没有结果 → 自然过渡到陪聊，不要让用户感到被冷落
- "没找到人" ≠ "结束对话"，而是 "那我先陪你聊"
- 不要连续调用多个工具而不给用户反馈，每调一个工具都要告诉用户你在做什么
- 如果用户说"算了"、"不用了"、"我自己来" → 尊重用户意愿，停止工具调用，正常聊天
`;
