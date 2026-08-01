/**
 * @file roleplay-session.tsx
 * @description 单人角色扮演交互组件 - 用户与AI角色对话
 * @module components/roleplay-session
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Scene, Role, StoryBlock } from '@/lib/data';

interface RolePlaySessionProps {
  scene: Scene;
  initialRoleIndex?: number;
}

type InputMode = 'dialogue' | 'thought';

interface Message {
  id: string;
  type: 'dialogue' | 'thought' | 'ai-catalyst' | 'ai-narration';
  character?: string;
  text: string;
  timestamp: number;
  isSpark?: boolean;
}

/* ===== 蓝白色系 ===== */
const COLORS = {
  bg: '#f0f7ff',
  ink: '#1e3a5f',
  inkLight: '#4a7ab0',
  inkFaint: '#8aacc8',
  inkGhost: '#b0cce0',
  blue: '#4a9fd8',
  blueBright: '#6bc0f0',
  blueDeep: '#3a7fc0',
  gold: '#7EC8E8',
  line: '#d8eaf5',
  card: '#ffffff',
  aiBlue: '#5ba8d8',
  aiBlueLight: '#e0f0ff',
};

/* ===== AI 催化提示库 ===== */
const AI_CATALYST_PROMPTS: Record<string, string[]> = {
  airport: [
    '十年没见的两个人，第一句话该怎么说？也许不是"你好"，而是沉默...',
    '行李转盘还在转，但你们都没有去看。这个瞬间，时间好像停了。',
    '他/她变了，又好像没变。你注意到了什么细节？',
    '机场的广播在催促，但你们谁都不想先开口。',
    '也许可以问一个简单的问题："这些年，过得好吗？"',
    '回忆涌上来了。你想起了什么？',
  ],
  cafe: [
    '咖啡凉了，但你们都没注意到。',
    '杯子上写着名字，但你们都在避免叫对方的名字。',
    '窗外的雨停了，但气氛还是很凝重。',
    '也许可以聊聊这杯咖啡的味道？',
    '他/她低头搅拌咖啡的样子，和十年前一样。',
  ],
  train: [
    '火车还有最后一站就要到终点。有些话，再不说就来不及了。',
    '窗外的风景在倒退，就像时间。',
    '也许可以问："你下一站去哪？"',
    '车厢里很安静，但你们心里都很吵。',
    '也许可以说出那个藏了很久的秘密。',
  ],
  rooftop: [
    '夜风很凉，但你们都不想进去。',
    '城市的灯火在脚下，但你们只看得到彼此。',
    '也许可以聊聊为什么来这里。',
    '沉默也是一种对话。',
    '也许可以说出那句一直没说的话。',
  ],
};

function getAICatalyst(sceneId: string, messageCount: number): string {
  const prompts = AI_CATALYST_PROMPTS[sceneId] || AI_CATALYST_PROMPTS.airport;
  const index = messageCount % prompts.length;
  return prompts[index];
}

function getAINarration(scene: Scene, messages: Message[]): string {
  const dialogueCount = messages.filter(m => m.type === 'dialogue').length;
  const thoughtCount = messages.filter(m => m.type === 'thought').length;
  
  if (dialogueCount === 0) {
    return `故事开始了。${scene.roles[0].name}和${scene.roles[1].name}在这个场景中相遇。空气中弥漫着一种说不清的情绪...`;
  }
  if (dialogueCount < 3) {
    return `对话刚刚开始，有些生疏，有些试探。十年的时光横亘在中间，谁都不知道该怎么跨越。`;
  }
  if (thoughtCount > dialogueCount) {
    return `内心独白比说出口的话还多。也许，真正想说的话，还藏在心里。`;
  }
  if (dialogueCount > 5) {
    return `对话渐渐深入，那些藏在心底的话，开始一点一点浮出水面。`;
  }
  return `故事在继续，每一句话都在拉近彼此的距离。`;
}

export function RolePlaySession({ scene, initialRoleIndex = 0 }: RolePlaySessionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('dialogue');
  const [myRoleIndex, setMyRoleIndex] = useState(initialRoleIndex);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [isMarkingSpark, setIsMarkingSpark] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const myRole: Role = scene.roles[myRoleIndex];
  const otherRole: Role | undefined = scene.roles[1 - myRoleIndex];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [inputMode]);

  // Load saved session
  useEffect(() => {
    const saved = localStorage.getItem(`roleplay-${scene.id}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setMessages(data.messages || []);
        setMyRoleIndex(data.myRoleIndex ?? initialRoleIndex);
        setHasStarted(true);
      } catch {
        // ignore
      }
    }
  }, [scene.id, initialRoleIndex]);

  // Save session
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(
        `roleplay-${scene.id}`,
        JSON.stringify({ messages, myRoleIndex })
      );
    }
  }, [messages, myRoleIndex, scene.id]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      type: inputMode,
      text,
      timestamp: Date.now(),
      ...(inputMode === 'dialogue' ? { character: myRole.name } : {}),
      ...(isMarkingSpark ? { isSpark: true } : {}),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsMarkingSpark(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStart = () => {
    setHasStarted(true);
    if (scene.openingLine && messages.length === 0) {
      const openingMsg: Message = {
        id: 'opening',
        type: 'dialogue',
        character: scene.roles[0].name,
        text: scene.openingLine,
        timestamp: Date.now(),
        isSpark: true,
      };
      setMessages([openingMsg]);
    }
  };

  const handleClear = () => {
    if (confirm('确定要清空所有对话记录吗？')) {
      setMessages([]);
      localStorage.removeItem(`roleplay-${scene.id}`);
    }
  };

  const handleExportStory = () => {
    const blocks: StoryBlock[] = messages
      .filter(m => m.type !== 'ai-catalyst' && m.type !== 'ai-narration')
      .map((msg) => {
        if (msg.type === 'thought') {
          return { type: 'thought', text: msg.text };
        }
        return {
          type: 'dialogue',
          character: msg.character,
          text: msg.text,
          isSpark: msg.isSpark,
        };
      });

    const storyData = {
      title: scene.title,
      sceneId: scene.id,
      blocks,
      createdAt: new Date().toISOString(),
      characters: scene.roles.map((r) => r.name),
    };

    const blob = new Blob([JSON.stringify(storyData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-${scene.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // AI 催化：生成对话引导（使用真实 AI）
  const handleAICatalyst = async () => {
    setIsAIThinking(true);
    try {
      const lastMessage = messages.filter(m => m.type === 'dialogue').slice(-1)[0]?.text || '';
      const conversationHistory = messages
        .filter(m => m.type === 'dialogue' || m.type === 'thought')
        .slice(-10)
        .map(m => ({
          role: m.type === 'dialogue' ? 'user' as const : 'assistant' as const,
          content: m.character ? `${m.character}: ${m.text}` : m.text,
        }));

      const response = await fetch('/api/ai/catalyst', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: scene.id,
          messageCount: messages.length,
          lastMessage,
          conversationHistory,
        }),
      });

      const data = await response.json();
      const catalystText = data.catalyst || '让对话继续，说出你心里想说的那句话...';
      
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai-catalyst',
        text: catalystText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('AI catalyst error:', error);
      // Fallback to local prompt
      const catalystText = getAICatalyst(scene.id, messages.length);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai-catalyst',
        text: catalystText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsAIThinking(false);
    }
  };

  // AI 旁白：生成故事叙述
  const handleAINarration = () => {
    setIsAIThinking(true);
    setTimeout(() => {
      const narrationText = getAINarration(scene, messages);
      const aiMsg: Message = {
        id: `ai-narr-${Date.now()}`,
        type: 'ai-narration',
        text: narrationText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsAIThinking(false);
    }, 800);
  };

  // Determine if a character is "left" (first role) or "right" (second role)
  const isLeftRole = (charName: string) => charName === scene.roles[0].name;
  const getRoleColor = (charName: string) => {
    const role = scene.roles.find((r) => r.name === charName);
    return role?.color || '#888';
  };

  // Get avatar initial
  const getAvatarInitial = (charName: string) => charName.charAt(0);

  /* ===== Role Selection Screen ===== */
  if (!hasStarted) {
    return (
      <div
        style={{
          background: `linear-gradient(180deg, #f0f8ff 0%, ${COLORS.bg} 50%, #e8f4ff 100%)`,
          minHeight: '100dvh',
          fontFamily: "'Noto Serif SC', serif",
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 16px' }}>
          {/* Header */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: 48,
              opacity: 0,
              animation: 'rpFadeIn 1s ease forwards',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: COLORS.inkFaint,
                letterSpacing: 4,
                marginBottom: 16,
              }}
            >
              {scene.location} · {scene.tags.join(' · ')}
            </div>
            <h1
              style={{
                fontSize: 28,
                color: COLORS.ink,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {scene.title}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: COLORS.inkLight,
                lineHeight: 1.8,
                maxWidth: 400,
                margin: '0 auto',
              }}
            >
              {scene.description}
            </p>
          </div>

          {/* Role Selection */}
          <div
            style={{
              opacity: 0,
              animation: 'rpFadeIn 1s ease 0.3s forwards',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: COLORS.inkFaint,
                letterSpacing: 2,
                marginBottom: 24,
              }}
            >
              选择你要扮演的角色
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {scene.roles.map((role, idx) => (
                <button
                  key={role.name}
                  onClick={() => {
                    setMyRoleIndex(idx);
                    handleStart();
                  }}
                  style={{
                    background: COLORS.card,
                    border: `1px solid ${COLORS.line}`,
                    borderRadius: 12,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(74,158,216,0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,158,216,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(74,158,216,0.08)';
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: role.color === '#ffffff' ? '#ffffff' : `linear-gradient(135deg, ${role.color}, ${role.color}dd)`,
                      border: role.color === '#ffffff' ? '2px solid #7EC8E8' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: role.color === '#ffffff' ? '#7EC8E8' : '#fff',
                      fontSize: 18,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {role.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: COLORS.ink,
                        marginBottom: 4,
                      }}
                    >
                      {role.name}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: COLORS.inkLight,
                        lineHeight: 1.5,
                      }}
                    >
                      {role.desc}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: COLORS.blue,
                      flexShrink: 0,
                    }}
                  >
                    扮演 →
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scene Info */}
          <div
            style={{
              marginTop: 48,
              padding: '20px 24px',
              background: `${COLORS.card}80`,
              borderRadius: 12,
              border: `1px solid ${COLORS.line}`,
              opacity: 0,
              animation: 'rpFadeIn 1s ease 0.6s forwards',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: COLORS.inkFaint,
                letterSpacing: 2,
                marginBottom: 12,
              }}
            >
              场景设定
            </div>
            <div
              style={{
                fontSize: 14,
                color: COLORS.inkLight,
                lineHeight: 1.8,
              }}
            >
              {scene.description}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes rpFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  /* ===== Main Chat Interface ===== */
  return (
    <div
      style={{
        background: `linear-gradient(180deg, #f0f8ff 0%, ${COLORS.bg} 50%, #e8f4ff 100%)`,
        minHeight: '100dvh',
        fontFamily: "'Noto Serif SC', serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `${COLORS.card}ee`,
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${COLORS.line}`,
          padding: '12px 16px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.ink,
              }}
            >
              {scene.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: COLORS.inkFaint,
              }}
            >
              扮演：{myRole.name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowRoleSelect(!showRoleSelect)}
              style={{
                background: 'none',
                border: `1px solid ${COLORS.line}`,
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                color: COLORS.inkLight,
                cursor: 'pointer',
              }}
            >
              切换角色
            </button>
            <button
              onClick={handleExportStory}
              style={{
                background: COLORS.blue,
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              导出故事
            </button>
          </div>
        </div>

        {/* Role Select Dropdown */}
        {showRoleSelect && (
          <div
            style={{
              maxWidth: 560,
              margin: '12px auto 0',
              padding: '12px',
              background: COLORS.card,
              borderRadius: 8,
              border: `1px solid ${COLORS.line}`,
            }}
          >
            {scene.roles.map((role, idx) => (
              <button
                key={role.name}
                onClick={() => {
                  setMyRoleIndex(idx);
                  setShowRoleSelect(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: idx === myRoleIndex ? `${COLORS.blue}15` : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: idx === myRoleIndex ? COLORS.blue : COLORS.inkLight,
                }}
              >
                {role.name} {idx === myRoleIndex ? '✓' : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 16px',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {messages.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: COLORS.inkFaint,
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
              <div>对话还未开始</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>
                在下方输入框开始你的第一句话
              </div>
            </div>
          )}

          {messages.map((msg) => {
            // AI Catalyst Message
            if (msg.type === 'ai-catalyst') {
              return (
                <div
                  key={msg.id}
                  style={{
                    margin: '24px 0',
                    padding: '16px 20px',
                    background: `linear-gradient(135deg, ${COLORS.aiBlueLight}, ${COLORS.card})`,
                    borderRadius: 12,
                    border: `1px solid ${COLORS.aiBlue}30`,
                    position: 'relative',
                    animation: 'rpMsgIn 0.4s ease',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: -8,
                      left: 16,
                      background: COLORS.aiBlue,
                      color: '#fff',
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    AI 催化
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: COLORS.aiBlue,
                      lineHeight: 1.8,
                      fontStyle: 'italic',
                      marginTop: 4,
                    }}
                  >
                    ✨ {msg.text}
                  </div>
                </div>
              );
            }

            // AI Narration Message
            if (msg.type === 'ai-narration') {
              return (
                <div
                  key={msg.id}
                  style={{
                    margin: '24px 0',
                    padding: '16px 20px',
                    background: `${COLORS.card}80`,
                    borderRadius: 12,
                    border: `1px dashed ${COLORS.inkGhost}`,
                    textAlign: 'center',
                    animation: 'rpMsgIn 0.4s ease',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.inkGhost,
                      letterSpacing: 2,
                      marginBottom: 8,
                    }}
                  >
                    — 旁白 —
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: COLORS.inkLight,
                      lineHeight: 1.8,
                      fontStyle: 'italic',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            }

            // Thought Message
            if (msg.type === 'thought') {
              return (
                <div
                  key={msg.id}
                  style={{
                    margin: '16px 0',
                    padding: '12px 16px',
                    borderLeft: `3px solid ${getRoleColor(myRole.name)}`,
                    background: `${getRoleColor(myRole.name)}08`,
                    borderRadius: '0 8px 8px 0',
                    animation: 'rpMsgIn 0.4s ease',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.inkFaint,
                      marginBottom: 4,
                    }}
                  >
                    {myRole.name}的内心独白
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: COLORS.inkLight,
                      fontStyle: 'italic',
                      lineHeight: 1.7,
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            }

            // Dialogue Message
            const isLeft = isLeftRole(msg.character || '');
            const roleColor = getRoleColor(msg.character || '');

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isLeft ? 'row' : 'row-reverse',
                  alignItems: 'flex-start',
                  gap: 12,
                  margin: '16px 0',
                  animation: 'rpMsgIn 0.4s ease',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {getAvatarInitial(msg.character || '')}
                </div>

                {/* Message Content */}
                <div
                  style={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isLeft ? 'flex-start' : 'flex-end',
                  }}
                >
                  {/* Character Name */}
                  <div
                    style={{
                      fontSize: 11,
                      color: roleColor,
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    {msg.character}
                    {msg.isSpark && (
                      <span style={{ color: COLORS.gold, marginLeft: 6 }}>
                        ✨ 高光
                      </span>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    style={{
                      background: isLeft
                        ? COLORS.card
                        : `linear-gradient(135deg, ${roleColor}, ${roleColor}dd)`,
                      color: isLeft ? COLORS.ink : '#fff',
                      padding: '12px 16px',
                      borderRadius: isLeft
                        ? '4px 16px 16px 16px'
                        : '16px 4px 16px 16px',
                      boxShadow: isLeft
                        ? '0 2px 8px rgba(74,158,216,0.08)'
                        : '0 2px 8px rgba(0,0,0,0.1)',
                      fontSize: 14,
                      lineHeight: 1.7,
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI Thinking Indicator */}
          {isAIThinking && (
            <div
              style={{
                margin: '16px 0',
                padding: '12px 16px',
                background: COLORS.aiBlueLight,
                borderRadius: 12,
                fontSize: 13,
                color: COLORS.aiBlue,
                animation: 'rpPulse 1s ease infinite',
              }}
            >
              AI 正在思考...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* AI Action Buttons */}
      <div
        style={{
          background: `${COLORS.card}ee`,
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${COLORS.line}`,
          padding: '8px 16px',
        }}
      >
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto',
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          <button
            onClick={handleAICatalyst}
            disabled={isAIThinking}
            style={{
              background: `linear-gradient(135deg, ${COLORS.aiBlue}, ${COLORS.aiBlue}dd)`,
              border: 'none',
              borderRadius: 20,
              padding: '8px 16px',
              fontSize: 12,
              color: '#fff',
              cursor: isAIThinking ? 'not-allowed' : 'pointer',
              opacity: isAIThinking ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ✨ AI 催化
          </button>
          <button
            onClick={handleAINarration}
            disabled={isAIThinking}
            style={{
              background: `${COLORS.card}`,
              border: `1px solid ${COLORS.aiBlue}40`,
              borderRadius: 20,
              padding: '8px 16px',
              fontSize: 12,
              color: COLORS.aiBlue,
              cursor: isAIThinking ? 'not-allowed' : 'pointer',
              opacity: isAIThinking ? 0.6 : 1,
            }}
          >
            📖 AI 旁白
          </button>
          <button
            onClick={handleClear}
            style={{
              background: 'none',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 20,
              padding: '8px 16px',
              fontSize: 12,
              color: COLORS.inkFaint,
              cursor: 'pointer',
            }}
          >
            清空
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div
        style={{
          background: COLORS.card,
          borderTop: `1px solid ${COLORS.line}`,
          padding: '12px 16px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {/* Mode Toggle */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 8,
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setInputMode('dialogue')}
              style={{
                background: inputMode === 'dialogue' ? COLORS.blue : 'transparent',
                border: `1px solid ${inputMode === 'dialogue' ? COLORS.blue : COLORS.line}`,
                borderRadius: 16,
                padding: '4px 12px',
                fontSize: 12,
                color: inputMode === 'dialogue' ? '#fff' : COLORS.inkLight,
                cursor: 'pointer',
              }}
            >
              对话
            </button>
            <button
              onClick={() => setInputMode('thought')}
              style={{
                background: inputMode === 'thought' ? COLORS.gold : 'transparent',
                border: `1px solid ${inputMode === 'thought' ? COLORS.gold : COLORS.line}`,
                borderRadius: 16,
                padding: '4px 12px',
                fontSize: 12,
                color: inputMode === 'thought' ? '#fff' : COLORS.inkLight,
                cursor: 'pointer',
              }}
            >
              内心独白
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setIsMarkingSpark(!isMarkingSpark)}
              style={{
                background: isMarkingSpark ? `${COLORS.gold}20` : 'transparent',
                border: `1px solid ${isMarkingSpark ? COLORS.gold : COLORS.line}`,
                borderRadius: 16,
                padding: '4px 12px',
                fontSize: 12,
                color: isMarkingSpark ? COLORS.gold : COLORS.inkFaint,
                cursor: 'pointer',
              }}
            >
              ✨ 标记高光
            </button>
          </div>

          {/* Input */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                inputMode === 'dialogue'
                  ? `以${myRole.name}的身份说话...`
                  : `写下${myRole.name}的内心想法...`
              }
              rows={2}
              style={{
                flex: 1,
                border: `1px solid ${COLORS.line}`,
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 14,
                fontFamily: "'Noto Serif SC', serif",
                resize: 'none',
                outline: 'none',
                background: inputMode === 'thought' ? `${COLORS.gold}08` : COLORS.card,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              style={{
                background: inputText.trim()
                  ? inputMode === 'thought'
                    ? COLORS.gold
                    : COLORS.blue
                  : COLORS.line,
                border: 'none',
                borderRadius: 12,
                padding: '10px 20px',
                fontSize: 14,
                color: '#fff',
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 500,
              }}
            >
              发送
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rpFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rpMsgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rpPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
