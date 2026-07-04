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
  type: 'dialogue' | 'thought';
  character?: string;
  text: string;
  timestamp: number;
  isSpark?: boolean;
}

/* ===== 浅蓝明亮色系 ===== */
const COLORS = {
  bg: '#f0f7ff',
  ink: '#2c3e50',
  inkLight: '#5a7a9a',
  inkFaint: '#8aafc8',
  inkGhost: '#b0d0e8',
  blue: '#4A9ED8',
  blueBright: '#5CC8F0',
  gold: '#e8b84a',
  line: '#d8eaf5',
  card: '#ffffff',
};

export function RolePlaySession({ scene, initialRoleIndex = 0 }: RolePlaySessionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('dialogue');
  const [myRoleIndex, setMyRoleIndex] = useState(initialRoleIndex);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [isMarkingSpark, setIsMarkingSpark] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
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
    const blocks: StoryBlock[] = messages.map((msg) => {
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

  // Determine if a character is "left" (first role) or "right" (second role)
  const isLeftRole = (charName: string) => charName === scene.roles[0].name;
  const getRoleColor = (charName: string) => {
    const role = scene.roles.find((r) => r.name === charName);
    return role?.color || '#888';
  };

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
              {scene.location.toUpperCase()}
            </div>
            <h1
              style={{
                fontSize: 42,
                fontWeight: 900,
                color: COLORS.ink,
                letterSpacing: 12,
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              {scene.title}
            </h1>
            <div
              style={{
                fontSize: 13,
                color: COLORS.inkFaint,
                letterSpacing: 2,
              }}
            >
              {scene.tags.join(' · ')}
            </div>
            <div
              style={{
                width: 40,
                height: 1,
                background: COLORS.line,
                margin: '24px auto 0',
              }}
            />
          </div>

          {/* Description */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: 40,
              opacity: 0,
              animation: 'rpFadeIn 1s 0.2s ease forwards',
            }}
          >
            <p
              style={{
                fontSize: 14,
                color: COLORS.inkLight,
                lineHeight: 2,
                maxWidth: 440,
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
              animation: 'rpFadeIn 1s 0.4s ease forwards',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                fontSize: 11,
                color: COLORS.inkGhost,
                letterSpacing: 3,
                marginBottom: 24,
              }}
            >
              选择你要扮演的角色
            </div>

            {scene.roles.map((role, i) => (
              <button
                key={role.name}
                onClick={() => {
                  setMyRoleIndex(i);
                  handleStart();
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '20px 24px',
                  marginBottom: 12,
                  background: COLORS.card,
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: 16,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 12px rgba(74,158,216,0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.blueBright;
                  e.currentTarget.style.boxShadow =
                    '0 4px 20px rgba(90,176,216,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.line;
                  e.currentTarget.style.boxShadow =
                    '0 2px 12px rgba(74,158,216,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${role.color}cc, ${role.color})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 18,
                      fontWeight: 700,
                      flexShrink: 0,
                      fontFamily: "'Noto Sans SC', sans-serif",
                    }}
                  >
                    {role.shortName}
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
                        fontSize: 12,
                        color: COLORS.inkFaint,
                      }}
                    >
                      {role.identity}
                    </div>
                  </div>
                  <div style={{ color: COLORS.inkGhost }}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Secret Hints */}
          <div
            style={{
              marginTop: 32,
              padding: '16px 20px',
              background: `linear-gradient(135deg, rgba(90,176,216,0.06), rgba(126,200,232,0.04))`,
              borderRadius: 12,
              border: `1px solid ${COLORS.line}`,
              opacity: 0,
              animation: 'rpFadeIn 1s 0.6s ease forwards',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: COLORS.gold,
                letterSpacing: 2,
                marginBottom: 10,
              }}
            >
              秘密提示（仅自己可见）
            </div>
            {scene.roles.map((role) => (
              <div
                key={role.name}
                style={{
                  fontSize: 12,
                  color: COLORS.inkLight,
                  marginBottom: 6,
                  lineHeight: 1.8,
                }}
              >
                <span style={{ color: COLORS.ink, fontWeight: 600 }}>
                  {role.name}：
                </span>
                {role.secretHint}
              </div>
            ))}
          </div>
        </div>
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
      {/* Top Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${COLORS.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${myRole.color}cc, ${myRole.color})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Noto Sans SC', sans-serif",
              }}
            >
              {myRole.shortName}
            </div>
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
                  fontSize: 10,
                  color: COLORS.inkFaint,
                  fontFamily: "'Noto Sans SC', sans-serif",
                }}
              >
                你扮演 {myRole.name}
                {otherRole ? ` · 对方是 ${otherRole.name}` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowRoleSelect(!showRoleSelect)}
              style={{
                fontSize: 11,
                padding: '5px 12px',
                borderRadius: 8,
                border: `1px solid ${COLORS.line}`,
                background: 'transparent',
                color: COLORS.inkLight,
                cursor: 'pointer',
                fontFamily: "'Noto Sans SC', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.blue;
                e.currentTarget.style.color = COLORS.blue;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.line;
                e.currentTarget.style.color = COLORS.inkLight;
              }}
            >
              切换角色
            </button>
            <button
              onClick={handleExportStory}
              style={{
                fontSize: 11,
                padding: '5px 12px',
                borderRadius: 8,
                border: `1px solid ${COLORS.gold}40`,
                background: 'transparent',
                color: COLORS.gold,
                cursor: 'pointer',
                fontFamily: "'Noto Sans SC', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${COLORS.gold}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              导出故事
            </button>
            <button
              onClick={handleClear}
              style={{
                fontSize: 11,
                padding: '5px 12px',
                borderRadius: 8,
                border: `1px solid ${COLORS.line}`,
                background: 'transparent',
                color: COLORS.inkGhost,
                cursor: 'pointer',
                fontFamily: "'Noto Sans SC', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#e88';
                e.currentTarget.style.color = '#c66';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.line;
                e.currentTarget.style.color = COLORS.inkGhost;
              }}
            >
              清空
            </button>
          </div>
        </div>

        {/* Role switcher */}
        {showRoleSelect && (
          <div
            style={{
              maxWidth: 560,
              margin: '0 auto',
              padding: '0 16px 10px',
              display: 'flex',
              gap: 8,
            }}
          >
            {scene.roles.map((role, i) => (
              <button
                key={role.name}
                onClick={() => {
                  setMyRoleIndex(i);
                  setShowRoleSelect(false);
                }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: 12,
                  borderRadius: 8,
                  border: `1px solid ${i === myRoleIndex ? `${COLORS.gold}60` : COLORS.line}`,
                  background:
                    i === myRoleIndex ? `${COLORS.gold}08` : 'transparent',
                  color:
                    i === myRoleIndex ? COLORS.gold : COLORS.inkLight,
                  cursor: 'pointer',
                  fontFamily: "'Noto Sans SC', sans-serif",
                  transition: 'all 0.2s',
                }}
              >
                {role.shortName} · {role.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px 120px' }}>
          {/* Scene header */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: 40,
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
              {scene.location.toUpperCase()}
            </div>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: COLORS.ink,
                letterSpacing: 10,
                lineHeight: 1.2,
                marginBottom: 8,
              }}
            >
              {scene.title}
            </h1>
            <div
              style={{
                fontSize: 12,
                color: COLORS.inkFaint,
                letterSpacing: 2,
              }}
            >
              对话开始 · {scene.roles.map((r) => r.name).join(' & ')}
            </div>
            <div
              style={{
                width: 40,
                height: 1,
                background: COLORS.line,
                margin: '20px auto 0',
              }}
            />
          </div>

          {/* Spark bar */}
          {messages.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                marginBottom: 32,
                padding: '12px 0',
                borderTop: `1px solid ${COLORS.line}`,
                borderBottom: `1px solid ${COLORS.line}`,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, marginBottom: 2 }}>
                  {'🔥'.repeat(
                    messages.filter((m) => m.isSpark).length || 1
                  )}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.inkFaint,
                    letterSpacing: 1,
                    fontFamily: "'Noto Sans SC', sans-serif",
                  }}
                >
                  高光 x{messages.filter((m) => m.isSpark).length || 1}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, marginBottom: 2 }}>💬</div>
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.inkFaint,
                    letterSpacing: 1,
                    fontFamily: "'Noto Sans SC', sans-serif",
                  }}
                >
                  对话 x{messages.filter((m) => m.type === 'dialogue').length}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, marginBottom: 2 }}>❧</div>
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.inkFaint,
                    letterSpacing: 1,
                    fontFamily: "'Noto Sans SC', sans-serif",
                  }}
                >
                  独白 x{messages.filter((m) => m.type === 'thought').length}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => {
            if (msg.type === 'thought') {
              return (
                <div
                  key={msg.id}
                  style={{
                    fontStyle: 'italic',
                    color: COLORS.inkFaint,
                    fontSize: 13.5,
                    lineHeight: 1.8,
                    padding: '12px 20px',
                    margin: '8px 0',
                    borderLeft: `2px solid ${COLORS.line}`,
                    background: `linear-gradient(90deg, rgba(220,226,234,0.3), transparent)`,
                    borderRadius: '0 8px 8px 0',
                    opacity: 0,
                    animation: 'rpMsgIn 0.6s ease forwards',
                  }}
                >
                  <span style={{ color: COLORS.gold, marginRight: 4 }}>❧</span>
                  {msg.text}
                </div>
              );
            }

            const isLeft = isLeftRole(msg.character || '');
            const roleColor = getRoleColor(msg.character || '');

            return (
              <div
                key={msg.id}
                style={{
                  margin: '20px 0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: isLeft ? 'flex-start' : 'flex-end',
                  gap: 12,
                  opacity: 0,
                  animation: 'rpMsgIn 0.6s ease forwards',
                  position: 'relative',
                }}
              >
                {isLeft && (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${roleColor}cc, ${roleColor})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                      fontFamily: "'Noto Sans SC', sans-serif",
                    }}
                  >
                    {msg.character?.[0]}
                  </div>
                )}
                <div style={{ maxWidth: 420 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: isLeft ? COLORS.blue : COLORS.inkLight,
                      fontWeight: 600,
                      marginBottom: 4,
                      letterSpacing: 1,
                      textAlign: isLeft ? 'left' : 'right',
                      fontFamily: "'Noto Sans SC', sans-serif",
                    }}
                  >
                    {msg.character}
                  </div>
                  <div
                    style={{
                      background: isLeft
                        ? COLORS.card
                        : 'linear-gradient(135deg, #7EC8E8, #5AB0D8)',
                      padding: '14px 18px',
                      borderRadius: isLeft
                        ? '4px 16px 16px 16px'
                        : '16px 4px 16px 16px',
                      boxShadow: isLeft
                        ? '0 2px 12px rgba(74,158,216,0.08)'
                        : '0 2px 12px rgba(90,176,216,0.12)',
                      fontSize: 14.5,
                      color: isLeft ? COLORS.ink : '#1a3a50',
                      lineHeight: 1.9,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {msg.text}
                  </div>
                  {msg.isSpark && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 10,
                        color: COLORS.gold,
                        textAlign: isLeft ? 'left' : 'right',
                        fontFamily: "'Noto Sans SC', sans-serif",
                      }}
                    >
                      ✨ 高光时刻
                    </div>
                  )}
                </div>
                {!isLeft && (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${roleColor}cc, ${roleColor})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                      fontFamily: "'Noto Sans SC', sans-serif",
                    }}
                  >
                    {msg.character?.[0]}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />

          {/* Empty state */}
          {messages.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 0',
                color: COLORS.inkGhost,
                fontSize: 13,
                opacity: 0,
                animation: 'rpFadeIn 1s ease forwards',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>💬</div>
              <div>对话还没有开始</div>
              <div
                style={{
                  fontSize: 12,
                  marginTop: 6,
                  color: COLORS.inkGhost,
                }}
              >
                在下方输入你的第一句台词吧
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${COLORS.line}`,
          zIndex: 20,
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '10px 16px 14px' }}>
          {/* Mode Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <button
              onClick={() => setInputMode('dialogue')}
              style={{
                fontSize: 11,
                padding: '5px 14px',
                borderRadius: 8,
                border: 'none',
                background:
                  inputMode === 'dialogue' ? `${COLORS.blue}15` : 'transparent',
                color:
                  inputMode === 'dialogue' ? COLORS.blue : COLORS.inkFaint,
                fontWeight: inputMode === 'dialogue' ? 600 : 400,
                cursor: 'pointer',
                fontFamily: "'Noto Sans SC', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              💬 对话
            </button>
            <button
              onClick={() => setInputMode('thought')}
              style={{
                fontSize: 11,
                padding: '5px 14px',
                borderRadius: 8,
                border: 'none',
                background:
                  inputMode === 'thought' ? `${COLORS.gold}15` : 'transparent',
                color:
                  inputMode === 'thought' ? COLORS.gold : COLORS.inkFaint,
                fontWeight: inputMode === 'thought' ? 600 : 400,
                cursor: 'pointer',
                fontFamily: "'Noto Sans SC', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              ❧ 内心独白
            </button>
            {inputMode === 'dialogue' && (
              <button
                onClick={() => setIsMarkingSpark(!isMarkingSpark)}
                style={{
                  fontSize: 11,
                  padding: '5px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: isMarkingSpark
                    ? `${COLORS.gold}15`
                    : 'transparent',
                  color: isMarkingSpark ? COLORS.gold : COLORS.inkFaint,
                  fontWeight: isMarkingSpark ? 600 : 400,
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  fontFamily: "'Noto Sans SC', sans-serif",
                  transition: 'all 0.2s',
                }}
              >
                ✨ 标记高光
              </button>
            )}
          </div>

          {/* Input Row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                inputMode === 'dialogue'
                  ? `以 ${myRole.name} 的身份说些什么...`
                  : '写下此刻的内心独白...'
              }
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                borderRadius: 12,
                border: `1px solid ${COLORS.line}`,
                background: '#fafbfc',
                padding: '12px 16px',
                fontSize: 14,
                color: COLORS.ink,
                fontFamily: "'Noto Serif SC', serif",
                outline: 'none',
                minHeight: 44,
                maxHeight: 120,
                lineHeight: 1.6,
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor =
                  inputMode === 'dialogue' ? `${COLORS.blue}60` : `${COLORS.gold}60`;
                e.currentTarget.style.background = '#fff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.line;
                e.currentTarget.style.background = '#fafbfc';
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              style={{
                height: 44,
                padding: '0 20px',
                borderRadius: 12,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                fontFamily: "'Noto Sans SC', sans-serif",
                transition: 'all 0.2s',
                background: !inputText.trim()
                  ? '#eee'
                  : inputMode === 'dialogue'
                    ? COLORS.blue
                    : COLORS.gold,
                color: !inputText.trim()
                  ? COLORS.inkGhost
                  : '#fff',
                boxShadow: inputText.trim()
                  ? `0 2px 8px ${inputMode === 'dialogue' ? `${COLORS.blue}30` : `${COLORS.gold}30`}`
                  : 'none',
              }}
            >
              发送
            </button>
          </div>

          {/* Hint */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 10,
              color: COLORS.inkGhost,
              marginTop: 6,
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            按 Enter 发送 · Shift+Enter 换行
            {inputMode === 'thought' && ' · 内心独白只有你自己能看到'}
          </div>
        </div>
      </div>

      {/* Inline CSS animations */}
      <style>{`
        @keyframes rpFadeIn { to { opacity: 1; } }
        @keyframes rpMsgIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
