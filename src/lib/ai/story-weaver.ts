/**
 * 故事串联引擎
 *
 * 将用户标记的"火花"（精彩对话片段）串联成完整的故事。
 * 支持剧本、叙事、对白三种格式。
 */

import { getIO } from '@/server/io'

export interface Spark {
  content: string
  identity: string
  timestamp: Date
  emotionTags?: string[]
}

export interface StoryWeaveRequest {
  sparks: Spark[]
  format: 'script' | 'narrative' | 'dialogue'
  tone?: string
  length?: 'short' | 'medium' | 'long'
}

export interface StoryWeaveResponse {
  story: string
  title: string
  summary: string
  characterProfiles: Array<{
    identity: string
    traits: string[]
    role: string
  }>
  estimatedReadingTime: number
}

// ============================================================================
// DeepSeek API 调用
// ============================================================================

interface DeepSeekMessage {
  role: string
  content: string
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured')
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 1500,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as DeepSeekResponse
  return data.choices[0]?.message?.content?.trim() || ''
}

// ============================================================================
// generateBranchOptions: 根据对话生成剧情分支选项
// ============================================================================

export interface BranchGenerateRequest {
  messages: string
  storyTitle: string
}

export interface BranchGenerateResponse {
  content: string
  options: Array<{ text: string; description: string }>
}

export async function generateBranchOptions(
  request: BranchGenerateRequest
): Promise<BranchGenerateResponse> {
  const { messages, storyTitle } = request

  const systemPrompt = `你是一位资深编剧和故事分析师，擅长从群像对白的剧情中挖掘潜在的剧情分支。

你的任务：
1. 分析当前对白的发展方向和角色的动机冲突
2. 提出一个剧情分支点（一个关键的选择时刻）
3. 生成3个不同的分支选项，每个选项代表故事可能走向的不同方向

输出格式必须是严格的 JSON：
{
  "content": "剧情分支描述（50字以内，说明当前面临的选择）",
  "options": [
    { "text": "选项A标题（10字以内）", "description": "选项A的简要描述（30字以内）" },
    { "text": "选项B标题（10字以内）", "description": "选项B的简要描述（30字以内）" },
    { "text": "选项C标题（10字以内）", "description": "选项C的简要描述（30字以内）" }
  ]
}`

  const userPrompt = `故事标题：${storyTitle || '未命名故事'}

最近的对白记录：
${messages.slice(-1500)}

请分析以上对白，找出一个自然的剧情分支点，并生成3个不同的分支选项。`

  try {
    const aiResponse = await callDeepSeek(systemPrompt, userPrompt)

    let parsed: BranchGenerateResponse
    try {
      parsed = JSON.parse(aiResponse)
    } catch {
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim())
      } else {
        const braceMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (braceMatch) {
          parsed = JSON.parse(braceMatch[0])
        } else {
          throw new Error('无法解析 AI 响应')
        }
      }
    }

    return {
      content: parsed.content || '剧情走到了一个关键的分岔口...',
      options: parsed.options || [
        { text: '选项A', description: '走向A方向' },
        { text: '选项B', description: '走向B方向' },
        { text: '选项C', description: '走向C方向' },
      ],
    }
  } catch (error) {
    console.error('[StoryWeaver] Branch generation failed:', error)
    return {
      content: '剧情走到了一个关键的分岔口，接下来的选择将改变一切...',
      options: [
        { text: '坚持立场', description: '角色坚持自己的想法，可能引发冲突' },
        { text: '妥协退让', description: '角色选择让步，寻求和解的可能' },
        { text: '另辟蹊径', description: '角色找到一个出人意料的第三种方案' },
      ],
    }
  }
}

// ============================================================================
// weaveStory: 将火花串联成完整故事
// ============================================================================

export async function weaveStory(
  request: StoryWeaveRequest
): Promise<StoryWeaveResponse> {
  const { sparks, format, tone, length = 'medium' } = request

  const systemPrompt = `你是一位专业的小说编剧和创意写作教练，擅长将真实对话片段串联成引人入胜的群像故事。

你的任务：
1. 根据提供的对话"火花"，创作一个完整、连贯的故事
2. 保持每个角色的职业真实性和语言风格
3. 根据指定的格式（剧本/叙事/对白）输出
4. 分析每个角色的性格特征和在故事中的作用

输出格式必须是严格的 JSON，格式如下：
{
  "title": "故事标题",
  "story": "完整的故事内容",
  "summary": "一句话总结",
  "characterProfiles": [
    { "identity": "角色身份", "traits": ["特征1", "特征2"], "role": "在故事中的角色定位" }
  ],
  "estimatedReadingTime": 预计阅读时间（分钟，整数）
}`

  const sparksText = sparks
    .map(
      (s, i) =>
        `[火花${i + 1}] 身份：${s.identity}\n内容：${s.content}\n情感：${s.emotionTags?.join('、') || '未标注'}\n`
    )
    .join('\n')

  const lengthMap = {
    short: '300-500字',
    medium: '800-1200字',
    long: '1500-2500字',
  }

  const formatMap = {
    script: '剧本格式（场景标题 + 角色名：对白）',
    narrative: '叙事体小说（第三人称叙述）',
    dialogue: '纯对白体（类似话剧对白，但有少量场景提示）',
  }

  const userPrompt = `请将以下对话火花串联成一个完整的故事。

## 火花素材
${sparksText}

## 创作要求
- 格式：${formatMap[format]}
- 语气风格：${tone || '根据内容自然呈现'}
- 篇幅：${lengthMap[length]}
- 要求：保持每个角色的职业语言特点，让对话自然衔接，形成有起承转合的完整故事

请直接输出 JSON 格式的结果。`

  try {
    const aiResponse = await callDeepSeek(systemPrompt, userPrompt)

    // 尝试从响应中提取 JSON
    let parsed: Partial<StoryWeaveResponse>
    try {
      // 先尝试直接解析整个响应
      parsed = JSON.parse(aiResponse)
    } catch {
      // 如果失败，尝试从 Markdown 代码块中提取 JSON
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim())
      } else {
        // 尝试匹配 {...} 结构
        const braceMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (braceMatch) {
          parsed = JSON.parse(braceMatch[0])
        } else {
          throw new Error('无法解析 AI 响应')
        }
      }
    }

    return {
      story: parsed.story || aiResponse,
      title: parsed.title || '未命名故事',
      summary: parsed.summary || '',
      characterProfiles:
        parsed.characterProfiles ||
        sparks.map((s) => ({
          identity: s.identity,
          traits: s.emotionTags || ['待分析'],
          role: '参与者',
        })),
      estimatedReadingTime: parsed.estimatedReadingTime || Math.max(1, Math.ceil((parsed.story?.length || 0) / 500)),
    }
  } catch (error) {
    console.error('[StoryWeaver] AI generation failed:', error)
    return generateFallbackStory(sparks, format)
  }
}

/**
 * AI 失败时的降级故事生成
 */
function generateFallbackStory(
  sparks: Spark[],
  format: string
): StoryWeaveResponse {
  const title = sparks[0]?.content.slice(0, 20) + '...' || '未命名故事'

  let story = ''

  if (format === 'script') {
    story = sparks
      .map(
        (s) =>
          `【场景】\n${s.identity}：${s.content}\n`
      )
      .join('\n')
  } else if (format === 'dialogue') {
    story = sparks.map((s) => `${s.identity}：${s.content}`).join('\n\n')
  } else {
    story = `这是一个由${sparks.length}个火花串联而成的故事。\n\n${sparks
      .map((s, i) => `${i + 1}. 【${s.identity}】${s.content}`)
      .join('\n\n')}`
  }

  return {
    story,
    title,
    summary: `基于${sparks.length}个火花生成的故事`,
    characterProfiles: sparks.map((s) => ({
      identity: s.identity,
      traits: s.emotionTags || ['真实', '生动'],
      role: '故事参与者',
    })),
    estimatedReadingTime: Math.max(1, Math.ceil(story.length / 500)),
  }
}

// ============================================================================
// analyzeStoryStructure: 分析故事结构
// ============================================================================

export async function analyzeStoryStructure(
  sparks: Spark[]
): Promise<{
  potentialPlotPoints: string[]
  characterArcs: string[]
  suggestedFormat: string
}> {
  const systemPrompt = `你是一位故事结构分析专家。请分析提供的对话片段，指出潜在的情节发展点和角色成长弧线。

输出格式必须是严格的 JSON：
{
  "potentialPlotPoints": ["情节点1", "情节点2", "情节点3"],
  "characterArcs": ["角色弧线1", "角色弧线2"],
  "suggestedFormat": "推荐的输出格式(script/narrative/dialogue)"
}`

  const sparksText = sparks
    .map((s) => `- ${s.identity}: "${s.content}" [情感：${s.emotionTags?.join('、') || '未标注'}]`)
    .join('\n')

  const userPrompt = `请分析以下对话火花，给出故事结构建议：\n\n${sparksText}\n\n请直接输出 JSON。`

  try {
    const aiResponse = await callDeepSeek(systemPrompt, userPrompt)

    let parsed: {
      potentialPlotPoints?: string[]
      characterArcs?: string[]
      suggestedFormat?: string
    }

    try {
      parsed = JSON.parse(aiResponse)
    } catch {
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim())
      } else {
        const braceMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (braceMatch) {
          parsed = JSON.parse(braceMatch[0])
        } else {
          throw new Error('无法解析 AI 响应')
        }
      }
    }

    return {
      potentialPlotPoints: parsed.potentialPlotPoints || [],
      characterArcs: parsed.characterArcs || [],
      suggestedFormat: parsed.suggestedFormat || 'script',
    }
  } catch (error) {
    console.error('[StoryWeaver] Structure analysis failed:', error)
    return {
      potentialPlotPoints: sparks.map((s) => `${s.identity}: ${s.content.slice(0, 30)}...`),
      characterArcs: sparks.map((s) => `${s.identity}的情感变化`),
      suggestedFormat: 'script',
    }
  }
}
