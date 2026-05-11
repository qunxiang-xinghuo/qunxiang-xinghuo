'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import ScenarioReader from '@/components/brainhole/ScenarioReader';
import { useBrainhole, aiPrompts } from '@/hooks/useBrainhole';
import { useAuth } from '@/hooks/useAuth';
import { useReaction } from '@/hooks/useReaction';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { Sparkles, Mic, Send } from 'lucide-react';

type PageState = 'record' | 'feedback';

export default function BrainholeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const brainholeId = params.id as string;
  const { getBrainholeById, getRandomPrompt } = useBrainhole();
  const { user } = useAuth();
  const { submitReaction } = useReaction();
  const { isRecording, transcript, startRecording, stopRecording, resetTranscript } = useVoiceRecorder();
  
  const [pageState, setPageState] = useState<PageState>('record');
  const [reactionContent, setReactionContent] = useState('');
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [reactionCount, setReactionCount] = useState(0);

  const brainhole = getBrainholeById(brainholeId);

  useEffect(() => {
    setSelectedPromptIndex(Math.floor(Math.random() * aiPrompts.length));
    try {
      const savedReactions = localStorage.getItem('xh_reactions');
      if (savedReactions) {
        const parsed = JSON.parse(savedReactions);
        setReactionCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch {
      setReactionCount(0);
    }
  }, [brainholeId]);

  useEffect(() => {
    if (transcript) {
      setReactionContent(prev => prev + transcript);
    }
  }, [transcript]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    if (!reactionContent.trim() || !user || !brainhole || submitting) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      await submitReaction({
        brainholeId,
        identityLabel: user.identity.label,
        content: reactionContent.trim(),
        aiPrompt: aiPrompts[selectedPromptIndex],
      });
      setReactionCount(prev => prev + 1);
      setPageState('feedback');
    } catch (err) {
      setSubmitError('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    router.push('/match');
  };

  if (!brainhole) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-gray-400 text-sm">脑洞不存在</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-xh-accent text-white rounded-xl"
        >
          返回
        </button>
      </div>
    );
  }

  if (pageState === 'feedback') {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" id="sparkles-container">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="sparkle"
              style={{
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's',
                animationDuration: (3 + Math.random() * 2) + 's',
              }}
            >
              <Sparkles
                className="text-xh-gold"
                style={{
                  width: (8 + Math.random() * 12) + 'px',
                  height: (8 + Math.random() * 12) + 'px',
                  opacity: (0.3 + Math.random() * 0.5),
                }}
              />
            </div>
          ))}
        </div>
        <div className="relative z-10 text-center">
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-xh-gold/30 absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}></div>
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-xh-gold/20 to-xh-gold-dark/20 flex items-center justify-center border border-xh-gold/30 animate-pulse-glow">
                <Sparkles className="w-12 h-12 text-xh-gold" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">你的真实反应已被收录</h2>
          <p className="text-gray-400 mb-2">成为故事燃料</p>
          <div className="inline-flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2 mb-8">
            <svg className="w-4 h-4 text-xh-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sm text-gray-300">你已累计记录 <span className="text-xh-gold font-bold">{reactionCount}</span> 个真实反应</span>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-xh-btn to-xh-btn-dark text-white py-4 rounded-xl font-medium shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15" />
              </svg>
              继续探索下一个脑洞
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-400 py-4 rounded-xl font-medium hover:text-white hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="记录反应"
        showBack
        onBack={() => router.back()}
      />

      <ScenarioReader
        title={brainhole.title}
        content={brainhole.content}
        aiPrompt={aiPrompts[selectedPromptIndex]}
      />

      <div className="px-4 mb-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-xh-accent/20 text-xh-accent px-3 py-1.5 rounded-full">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-medium">{user?.identity.label || '匿名用户'}</span>
        </div>
        <span className="text-xs text-gray-500">正在发言</span>
      </div>

      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
          {aiPrompts.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedPromptIndex(i)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] transition-colors ${
                i === selectedPromptIndex
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'bg-gray-800 text-gray-500 border border-gray-700'
              }`}
            >
              引导 {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 flex flex-col">
        <div className="relative flex-1 bg-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden">
          <textarea
            value={reactionContent}
            onChange={(e) => setReactionContent(e.target.value)}
            placeholder="在这里写下你的第一反应..."
            className="w-full h-full bg-transparent p-4 text-sm text-white placeholder-gray-500 resize-none focus:outline-none"
          />
          <div className="absolute bottom-3 right-3 text-[10px] text-gray-600">
            {reactionContent.length} 字
          </div>
        </div>
        {submitError && (
          <p className="text-xs text-red-400 text-center mb-2">{submitError}</p>
        )}
        <div className="flex items-center justify-between py-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isRecording
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
            }`}
          >
            {isRecording ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>停止录音</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>语音输入</span>
              </>
            )}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reactionContent.trim() || submitting}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
              reactionContent.trim() && !submitting
                ? 'bg-gradient-to-r from-xh-btn to-xh-btn-dark text-white shadow-lg'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{submitting ? '提交中...' : '记录这个反应'}</span>
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center justify-center gap-1 text-[10px] text-gray-600">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{new Date().toLocaleString('zh-CN')}</span>
      </div>
    </div>
  );
}
