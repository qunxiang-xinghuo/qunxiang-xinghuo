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

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mode change
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
    // Add opening line if exists
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

  // Role selection screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen site-bg flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full">
          {/* Scene Info */}
          <div className="text-center mb-10 opacity-0 animate-fade-in">
            <div className="text-[11px] tracking-[4px] text-ink-muted mb-3">
              {scene.location}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink tracking-wide mb-4">
              {scene.title}
            </h1>
            <p className="text-sm text-ink-secondary leading-relaxed max-w-md mx-auto">
              {scene.description}
            </p>
            <div className="w-10 h-0.5 bg-brand-gold/40 mx-auto mt-6 rounded-full" />
          </div>

          {/* Role Selection */}
          <div className="space-y-4 opacity-0 animate-fade-in-up delay-200">
            <div className="text-center text-[11px] text-ink-muted tracking-[3px] mb-6">
              选择你要扮演的角色
            </div>
            {scene.roles.map((role, i) => (
              <button
                key={role.name}
                onClick={() => {
                  setMyRoleIndex(i);
                  handleStart();
                }}
                className="w-full text-left p-5 rounded-2xl border border-border/60 bg-card-bg hover:border-brand-gold/40 hover:shadow-lg hover:shadow-brand-blue/5 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${role.color}, ${role.color}dd)`,
                    }}
                  >
                    {role.shortName}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-semibold text-ink group-hover:text-brand-blue transition-colors">
                      {role.name}
                    </div>
                    <div className="text-[11px] text-ink-muted mt-0.5">
                      {role.identity}
                    </div>
                  </div>
                  <div className="text-ink-muted group-hover:text-brand-gold transition-colors">
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
          <div className="mt-8 p-4 rounded-xl bg-brand-blue/5 border border-brand-blue/10 opacity-0 animate-fade-in-up delay-400">
            <div className="text-[10px] text-brand-blue/60 tracking-[2px] mb-2">
              秘密提示（仅自己可见）
            </div>
            <div className="space-y-2">
              {scene.roles.map((role) => (
                <div key={role.name} className="text-xs text-ink-secondary">
                  <span className="font-medium text-ink">{role.name}：</span>
                  {role.secretHint}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="min-h-screen site-bg flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{
                background: `linear-gradient(135deg, ${myRole.color}, ${myRole.color}dd)`,
              }}
            >
              {myRole.shortName}
            </div>
            <div>
              <div className="text-sm font-medium text-ink">{scene.title}</div>
              <div className="text-[10px] text-ink-muted">
                你扮演 {myRole.name}
                {otherRole ? ` · 对方是 ${otherRole.name}` : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRoleSelect(!showRoleSelect)}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-border text-ink-secondary hover:border-brand-blue/30 hover:text-brand-blue transition-colors"
            >
              切换角色
            </button>
            <button
              onClick={handleExportStory}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/5 transition-colors"
            >
              导出故事
            </button>
            <button
              onClick={handleClear}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-border text-ink-muted hover:border-red-200 hover:text-red-400 transition-colors"
            >
              清空
            </button>
          </div>
        </div>

        {/* Role switcher dropdown */}
        {showRoleSelect && (
          <div className="max-w-2xl mx-auto px-4 pb-3">
            <div className="flex gap-2">
              {scene.roles.map((role, i) => (
                <button
                  key={role.name}
                  onClick={() => {
                    setMyRoleIndex(i);
                    setShowRoleSelect(false);
                  }}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                    i === myRoleIndex
                      ? 'border-brand-gold/40 bg-brand-gold/5 text-brand-gold'
                      : 'border-border text-ink-secondary hover:border-brand-blue/30'
                  }`}
                >
                  {role.shortName} · {role.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Scene header */}
          <div className="text-center mb-8 opacity-0 animate-fade-in">
            <div className="text-[10px] tracking-[4px] text-ink-muted mb-2">
              {scene.location}
            </div>
            <div className="text-xs text-ink-secondary">
              对话开始 · {scene.roles.map((r) => r.name).join(' & ')}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((msg) => {
              if (msg.type === 'thought') {
                return (
                  <div
                    key={msg.id}
                    className="thought-block opacity-0 animate-fade-in-up"
                  >
                    {msg.text}
                  </div>
                );
              }

              const isLeft = msg.character === scene.roles[0].name;
              const role = scene.roles.find((r) => r.name === msg.character);
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 opacity-0 animate-msg-in ${isLeft ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{
                      background: role
                        ? `linear-gradient(135deg, ${role.color}, ${role.color}dd)`
                        : '#888',
                    }}
                  >
                    {msg.character?.[0]}
                  </div>
                  <div className="max-w-[420px]">
                    <div
                      className={`text-[10px] font-semibold tracking-wider mb-1 ${
                        isLeft ? 'text-brand-blue' : 'text-ink-muted text-right'
                      }`}
                    >
                      {msg.character}
                    </div>
                    <div
                      className={`text-[14px] leading-[1.9] whitespace-pre-line ${
                        isLeft
                          ? 'bg-card-bg p-3.5 rounded-[4px_14px_14px_14px] text-ink card-shadow border border-border/40'
                          : 'bg-gradient-to-br from-[#2A7FB8] to-[#1F6090] p-3.5 rounded-[14px_4px_14px_14px] text-white/90'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.isSpark && (
                      <div className="mt-1 text-[10px] text-brand-gold flex items-center gap-1">
                        ✨ 高光时刻
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="text-center py-16 text-ink-muted text-sm">
              <div className="text-2xl mb-3">💬</div>
              <div>对话还没有开始</div>
              <div className="text-xs mt-1">在下方输入你的第一句台词吧</div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-border/40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setInputMode('dialogue')}
              className={`text-[11px] px-3 py-1.5 rounded-lg transition-all ${
                inputMode === 'dialogue'
                  ? 'bg-brand-blue/10 text-brand-blue font-medium'
                  : 'text-ink-muted hover:text-ink-secondary'
              }`}
            >
              💬 对话
            </button>
            <button
              onClick={() => setInputMode('thought')}
              className={`text-[11px] px-3 py-1.5 rounded-lg transition-all ${
                inputMode === 'thought'
                  ? 'bg-brand-gold/10 text-brand-gold font-medium'
                  : 'text-ink-muted hover:text-ink-secondary'
              }`}
            >
              ❧ 内心独白
            </button>
            {inputMode === 'dialogue' && (
              <button
                onClick={() => setIsMarkingSpark(!isMarkingSpark)}
                className={`text-[11px] px-3 py-1.5 rounded-lg transition-all ml-auto ${
                  isMarkingSpark
                    ? 'bg-brand-gold/10 text-brand-gold font-medium'
                    : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                ✨ 标记高光
              </button>
            )}
          </div>

          {/* Input */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
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
                className="w-full resize-none rounded-xl border border-border/60 bg-gray-50/50 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand-blue/40 focus:bg-white transition-all"
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`h-11 px-5 rounded-xl text-sm font-medium transition-all ${
                inputText.trim()
                  ? inputMode === 'dialogue'
                    ? 'bg-brand-blue text-white hover:bg-brand-blue/90 shadow-sm'
                    : 'bg-brand-gold text-white hover:bg-brand-gold/90 shadow-sm'
                  : 'bg-gray-100 text-ink-muted cursor-not-allowed'
              }`}
            >
              发送
            </button>
          </div>

          {/* Hint */}
          <div className="text-[10px] text-ink-muted mt-2 text-center">
            按 Enter 发送 · Shift+Enter 换行
            {inputMode === 'thought' && ' · 内心独白只有你自己能看到'}
          </div>
        </div>
      </div>
    </div>
  );
}
