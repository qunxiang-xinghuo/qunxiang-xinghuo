import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { scenes } from '@/lib/data';

export const dynamic = 'force-dynamic';

// POST /api/ai/catalyst - Get AI catalyst prompt using real LLM
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sceneId, messageCount, lastMessage, conversationHistory } = body;

    if (!sceneId) {
      return Response.json({ error: 'Missing sceneId' }, { status: 400 });
    }

    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) {
      return Response.json({ error: 'Scene not found' }, { status: 404 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // Build system prompt based on scene
    const systemPrompt = buildSystemPrompt(scene);
    
    // Build user prompt based on conversation state
    const userPrompt = buildUserPrompt(scene, messageCount || 0, lastMessage, conversationHistory || []);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    // Use streaming for real-time output
    const stream = client.stream(messages, {
      model: 'doubao-seed-2-0-mini-260215',
      temperature: 0.9,
    });

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const data = `data: ${JSON.stringify({ content: chunk.content.toString() })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI catalyst error:', error);
    return Response.json({ error: 'Failed to generate catalyst' }, { status: 500 });
  }
}

// POST /api/ai/catalyst/non-stream - Non-streaming version for simple use cases
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sceneId, messageCount, lastMessage, conversationHistory } = body;

    if (!sceneId) {
      return Response.json({ error: 'Missing sceneId' }, { status: 400 });
    }

    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) {
      return Response.json({ error: 'Scene not found' }, { status: 404 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = buildSystemPrompt(scene);
    const userPrompt = buildUserPrompt(scene, messageCount || 0, lastMessage, conversationHistory || []);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-mini-260215',
      temperature: 0.9,
    });

    return Response.json({ catalyst: response.content });
  } catch (error) {
    console.error('AI catalyst error:', error);
    return Response.json({ error: 'Failed to generate catalyst' }, { status: 500 });
  }
}

function buildSystemPrompt(scene: typeof scenes[0]) {
  return `你是一个角色扮演对话的"催化师"。你的任务是帮助两个正在角色扮演的用户更深入地进入角色，推动对话向更有情感深度的方向发展。

当前场景：${scene.title}
场景描述：${scene.description}
场景地点：${scene.location}

角色信息：
${scene.roles.map(r => `- ${r.name}：${r.desc}。身份：${r.identity}。秘密：${r.secret}`).join('\n')}

你的催化提示应该：
1. 简短有力，一句话（不超过30字）
2. 能够引发角色更深层次的情感表达
3. 与当前场景氛围契合
4. 有时可以挑战角色，让他们面对自己回避的问题
5. 有时可以温柔引导，让角色说出心里话
6. 避免重复，每次给出不同角度的提示

直接输出催化提示，不要有任何前缀、解释或引号。`;
}

function buildUserPrompt(
  scene: typeof scenes[0],
  messageCount: number,
  lastMessage?: string,
  conversationHistory?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
) {
  let prompt = `对话已经进行了 ${messageCount} 条消息。`;
  
  if (lastMessage) {
    prompt += `\n最后一条对话是："${lastMessage}"`;
  }

  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-5).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');
    prompt += `\n\n最近的对话内容：\n${recentHistory}`;
  }

  prompt += '\n\n请给出一条催化提示，帮助角色们更深入地对话。';
  
  return prompt;
}
