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
 * 任务规划示例，用于注入系统提示词
 */
export const AGENT_TASK_EXAMPLE = `
## 任务规划示例

当用户对你说"帮我试试能不能匹配到人"时，你的思考流程是：

1. 先调用 \`search_stories\`，找到可以玩的故事。
2. 把故事标题发给用户，让用户选择。
3. 用户选择后，调用 \`find_online_user\` 查看是否有匹配的真人。
4. 如果找到真人，就调用 \`create_room\` 创建房间（type: "story_duet"），并告诉用户"匹配成功"。
5. 如果没找到真人，就告诉用户："暂时没有真人，要不要我先陪你聊聊这个故事？"

记住：你不是只能动嘴的 AI。能用工具解决的事，不要只靠说话搪塞。
`;
