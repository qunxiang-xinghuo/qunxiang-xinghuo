'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
}

export default function ZhihuZhidaPage() {
  const [selectedModel, setSelectedModel] = useState<'zhida-fast-1p5' | 'zhida-thinking-1p5' | 'zhida-agent'>('zhida-thinking-1p5');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/zhihu/zhida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          model: selectedModel,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: json.data.content,
          reasoning: json.data.reasoningContent,
        }]);
      } else {
        setError(json.error?.message || '回答生成失败');
      }
    } catch (e) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-xh-primary">
      <TopBar title="知乎直答" />
      {/* Model selector */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={() => setSelectedModel('zhida-fast-1p5')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedModel === 'zhida-fast-1p5'
              ? 'bg-xh-accent text-white'
              : 'bg-white/5 text-white/50 hover:text-white'
          }`}
        >
          快速回答
        </button>
        <button
          onClick={() => setSelectedModel('zhida-thinking-1p5')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedModel === 'zhida-thinking-1p5'
              ? 'bg-xh-gold text-white'
              : 'bg-white/5 text-white/50 hover:text-white'
          }`}
        >
          深度思考
        </button>
        <button
          onClick={() => setSelectedModel('zhida-agent')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedModel === 'zhida-agent'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-white/50 hover:text-white'
          }`}
        >
          智能思考
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-white/30 text-sm">向知乎直答提问，开启深度探索</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-xh-accent text-white rounded-br-md'
                  : 'bg-white/5 text-white/80 rounded-bl-md'
              }`}>
                {msg.reasoning && (
                  <p className="text-xs text-white/40 mb-2 italic">💭 {msg.reasoning}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3">
              <p className="text-sm text-white/50 animate-pulse">思考中<span>.</span><span>.</span><span>.</span></p>
            </div>
          </motion.div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/5 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="输入问题..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-xh-gold/50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          aria-label="发送"
          className="w-12 h-12 bg-xh-accent rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-xh-accent/90 transition-colors"
        >
          {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
        </button>
      </div>
    </div>
  );
}