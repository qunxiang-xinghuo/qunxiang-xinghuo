/**
 * @file 创作工坊页面
 * @description AI 辅助创作工具
 * 提供场景生成、角色生成、秘密生成、故事润色等功能
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

type GenerateType = 'scene' | 'character' | 'secret' | 'story_polish';

interface GenerateResult {
  type: string;
  result: string;
  usedZhihuContext: boolean;
}

export default function WorkshopPage() {
  const [type, setType] = useState<GenerateType>('scene');
  const [prompt, setPrompt] = useState('');
  const [useZhihu, setUseZhihu] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [collectResult, setCollectResult] = useState<string>('');

  const typeLabels: Record<GenerateType, string> = {
    scene: '场景生成',
    character: '角色创建',
    secret: '秘密设计',
    story_polish: '故事润色',
  };

  const typePlaceholders: Record<GenerateType, string> = {
    scene: '描述你想要的场景，如：深夜的便利店，两个失眠的人相遇...',
    character: '描述你想要的角色，如：一个表面冷漠内心温柔的急诊科医生...',
    secret: '描述角色的秘密，如：她其实一直记得十年前的那个承诺...',
    story_polish: '粘贴需要润色的故事内容...',
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          prompt,
          useZhihuContext: useZhihu,
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        alert(data.error || '生成失败');
      }
    } catch (error) {
      console.error('Generate error:', error);
      alert('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async () => {
    setCollecting(true);
    setCollectResult('');
    
    try {
      const response = await fetch('/api/zhihu/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: prompt || typeLabels[type],
          type: type === 'story_polish' ? 'story' : type === 'secret' ? 'emotion' : type,
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setCollectResult(`成功采集 ${data.collected} 条素材`);
      } else {
        setCollectResult(data.error || '采集失败');
      }
    } catch (error) {
      console.error('Collect error:', error);
      setCollectResult('采集失败');
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f8ff] to-white">
      {/* Header */}
      <header className="border-b border-[#e0e8f0] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[#4a9fd8] hover:text-[#3a8fc8] transition-colors">
            ← 返回首页
          </Link>
          <h1 className="text-xl font-serif text-[#1a2e4a]">AI 创作工坊</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Intro */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif text-[#1a2e4a] mb-2">用 AI 和你的灵感，创造故事</h2>
          <p className="text-[#4a6888] text-sm">结合知乎真实素材，生成有深度的角色扮演内容</p>
        </div>

        {/* Type Selection */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {(Object.keys(typeLabels) as GenerateType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                type === t
                  ? 'bg-[#4a9fd8] text-white shadow-lg shadow-[#4a9fd8]/20'
                  : 'bg-white text-[#4a6888] border border-[#e0e8f0] hover:border-[#7EC8E8]'
              }`}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-xl border border-[#e0e8f0] p-6 mb-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={typePlaceholders[type]}
            className="w-full h-32 resize-none border-0 focus:ring-0 text-[#1a2e4a] placeholder-[#8a9db0] text-sm"
          />
          
          <div className="flex items-center justify-between pt-4 border-t border-[#e0e8f0]">
            <label className="flex items-center gap-2 text-sm text-[#4a6888]">
              <input
                type="checkbox"
                checked={useZhihu}
                onChange={(e) => setUseZhihu(e.target.checked)}
                className="w-4 h-4 rounded border-[#e0e8f0] text-[#4a9fd8] focus:ring-[#4a9fd8]"
              />
              使用知乎素材作为参考
            </label>
            
            <div className="flex gap-3">
              <button
                onClick={handleCollect}
                disabled={collecting}
                className="px-4 py-2 text-sm text-[#4a9fd8] border border-[#4a9fd8] rounded-lg hover:bg-[#4a9fd8]/5 transition-colors disabled:opacity-50"
              >
                {collecting ? '采集中...' : '采集素材'}
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="px-6 py-2 text-sm bg-[#4a9fd8] text-white rounded-lg hover:bg-[#3a8fc8] transition-colors disabled:opacity-50 shadow-lg shadow-[#4a9fd8]/20"
              >
                {loading ? '生成中...' : '开始创作'}
              </button>
            </div>
          </div>
          
          {collectResult && (
            <div className="mt-3 text-sm text-[#4a9fd8]">{collectResult}</div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-xl border border-[#e0e8f0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif text-[#1a2e4a]">创作结果</h3>
              {result.usedZhihuContext && (
                <span className="text-xs text-[#7EC8E8] bg-[#7EC8E8]/10 px-2 py-1 rounded">
                  已使用知乎素材
                </span>
              )}
            </div>
            <div className="prose prose-sm max-w-none text-[#1a2e4a] whitespace-pre-wrap leading-relaxed">
              {result.result}
            </div>
            <div className="mt-4 pt-4 border-t border-[#e0e8f0] flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(result.result)}
                className="px-4 py-2 text-sm text-[#4a6888] border border-[#e0e8f0] rounded-lg hover:border-[#7EC8E8] transition-colors"
              >
                复制内容
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setPrompt('');
                }}
                className="px-4 py-2 text-sm text-[#4a9fd8] border border-[#4a9fd8] rounded-lg hover:bg-[#4a9fd8]/5 transition-colors"
              >
                重新创作
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-6 bg-[#f0f8ff] rounded-xl border border-[#e0e8f0]">
          <h4 className="text-sm font-medium text-[#1a2e4a] mb-3">使用技巧</h4>
          <ul className="text-sm text-[#4a6888] space-y-2">
            <li>• <strong>场景生成</strong>：描述具体地点、时间、氛围，AI 会生成详细的场景设定</li>
            <li>• <strong>角色创建</strong>：描述性格特点、背景故事，AI 会创建立体的角色</li>
            <li>• <strong>秘密设计</strong>：描述情感冲突，AI 会设计有张力的角色秘密</li>
            <li>• <strong>故事润色</strong>：粘贴你的故事，AI 会用文学语言进行润色</li>
            <li>• <strong>采集素材</strong>：从知乎采集相关素材，让 AI 创作更有真实感</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
