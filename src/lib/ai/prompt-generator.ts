/**
 * AI 催化提示生成器
 *
 * 根据脑洞内容和用户身份，生成针对性的引导问题（催化提示），
 * 帮助用户从不同角度切入思考，激发创作灵感。
 *
 * 三级降级策略：
 * 1. DeepSeek API 生成个性化提示
 * 2. fallback-prompts 分类库匹配
 * 3. 通用基础提示兜底
 */

import { getFallbackPrompt } from './fallback-prompts'
import { getPersona } from '@/lib/ai/personas'

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
      temperature: 0.9,
      max_tokens: 300,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as DeepSeekResponse
  return data.choices[0]?.message?.content?.trim() || ''
}

// ============================================================================
// generatePromptFromContext: 根据上下文生成催化提示
// ============================================================================

export async function generatePromptFromContext(
  context: string,
  category?: string,
  tags?: string[]
): Promise<string> {
  try {
    const systemPrompt = getPersona('knowledge_feeder').systemPrompt

    const userPrompt = `请为以下脑洞生成一个催化提示：

情境：${context}
${category ? `分类：${category}` : ''}
${tags?.length ? `标签：${tags.join('、')}` : ''}

请直接输出问题：`;

    const result = await callDeepSeek(systemPrompt, userPrompt)
    if (result && result.length > 5) {
      return result
    }
    throw new Error('Empty or too short response from AI')
  } catch (error) {
    console.warn('[PromptGenerator] AI generation failed, using fallback:', error)
    return getFallbackPrompt(category, tags)
  }
}

// ============================================================================
// refinePrompt: 根据反馈优化提示
// ============================================================================

export async function refinePrompt(
  basePrompt: string,
  feedback?: string
): Promise<string> {
  try {
    const systemPrompt = `你是一位专业的创意写作教练。
你的任务是根据用户反馈，优化原有的引导问题，使其更精准、更有启发性。
要求：
1. 保留原问题的核心意图
2. 针对反馈进行具体改进
3. 输出优化后的问题，不要解释`

    const userPrompt = `原问题：${basePrompt}
${feedback ? `用户反馈：${feedback}` : '请让这个问题更具体、更有画面感'}

优化后的问题：`;

    const result = await callDeepSeek(systemPrompt, userPrompt)
    if (result && result.length > 5) {
      return result
    }
    throw new Error('Empty or too short response from AI')
  } catch (error) {
    console.warn('[PromptGenerator] Refinement failed, returning original:', error)
    return basePrompt
  }
}

// ============================================================================
// generateCatalystQuestions: 为脑洞生成多个催化问题
// ============================================================================

const DEFAULT_CATALYST_QUESTIONS = [
  '如果你是故事里的主角，接下来会怎么做？',
  '这个情境中，最让你感到矛盾的是什么？',
  '从不同身份的角度看，这个问题会有怎样的不同答案？',
]

export async function generateCatalystQuestions(
  brainholeContent: string,
  count: number = 3
): Promise<string[]> {
  try {
    const systemPrompt = `你是一位专业的创意写作教练。
你的任务是根据提供的"脑洞"内容，生成${count}个不同角度的引导问题。
要求：
1. 每个问题从不同的切入点出发（情感、逻辑、冲突、选择等）
2. 问题要有画面感，能激发想象
3. 输出必须是合法的 JSON 数组格式，例如：["问题1？", "问题2？", "问题3？"]
4. 只输出 JSON 数组，不要任何其他文字`

    const userPrompt = `请为以下脑洞生成${count}个催化问题：

${brainholeContent}

请输出 JSON 数组：`;

    const result = await callDeepSeek(systemPrompt, userPrompt)
    const questions = JSON.parse(result)
    if (Array.isArray(questions) && questions.length >= count) {
      return questions.slice(0, count)
    }
    throw new Error('Invalid response format')
  } catch (error) {
    console.warn('[PromptGenerator] Catalyst generation failed, using defaults:', error)
    return DEFAULT_CATALYST_QUESTIONS.slice(0, count)
  }
}
