'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface ScenarioReaderProps {
  title: string;
  content: string;
  aiPrompt?: string;
}

export default function ScenarioReader({ title, content, aiPrompt }: ScenarioReaderProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-gradient-to-r from-xh-card to-gray-800 rounded-2xl p-4 border border-gray-700/50 mx-4 my-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-xh-gold" />
          <span className="text-xs text-xh-gold">当前脑洞</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {expanded && (
        <div className="space-y-3">
          <h3 className="text-base font-medium text-white leading-relaxed">{title}</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{content}</p>
          
          {aiPrompt && (
            <div className="bg-gray-800/70 rounded-xl p-3 border border-violet-500/30 mt-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <p className="text-xs text-violet-300 mb-1">AI 引导提问</p>
                  <p className="text-sm text-gray-300">{aiPrompt}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
