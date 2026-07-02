'use client';

import { useState } from 'react';
import type { Scene } from '@/lib/data';

interface SceneDetailProps {
  scene: Scene;
}

export function SceneDetail({ scene }: SceneDetailProps) {
  const [activeRole, setActiveRole] = useState(0);
  const [entered, setEntered] = useState(false);

  return (
    <div className="px-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Ticket Card */}
        <div className="opacity-0 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Scene Visual Window */}
            <div className="h-44 relative overflow-hidden bg-gradient-to-br from-[#b4cce0] via-[#9cbcd4] to-[#9cbfa8]">
              {/* Sun */}
              <div className="absolute top-[12%] right-[18%] w-7 h-7 rounded-full bg-radial-[circle] from-[#fff8e8] via-[#f0e8c8] to-transparent shadow-[0_0_40px_rgba(240,224,180,0.35)]" />

              {/* Light spots */}
              <div className="absolute w-1.5 h-1.5 rounded-full bg-white/50 animate-float" style={{ top: '25%', left: '12%' }} />
              <div className="absolute w-2 h-2 rounded-full bg-[#fff8dc]/40 animate-float" style={{ top: '45%', left: '30%', animationDelay: '0.8s' }} />
              <div className="absolute w-1 h-1 rounded-full bg-white/40 animate-float" style={{ top: '20%', left: '55%', animationDelay: '1.5s' }} />

              {/* Clouds */}
              <div className="absolute w-20 h-7 bg-white/40 rounded-full blur-[1px] top-[15%] left-[4%] animate-float" style={{ animationDuration: '24s' }} />
              <div className="absolute w-16 h-5 bg-white/35 rounded-full blur-[1px] top-[38%] left-[42%] animate-float" style={{ animationDuration: '28s', animationDirection: 'reverse' }} />

              {/* Plane */}
              <div className="absolute top-[32%] text-white/50 text-sm animate-[fly_14s_linear_infinite]">
                ✈
              </div>

              {/* Grass */}
              <div className="absolute bottom-0 left-0 right-0 h-10">
                <svg viewBox="0 0 400 35" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M0 18 Q40 10 80 18 Q120 26 160 16 Q200 8 240 16 Q280 24 320 14 Q360 6 400 16 L400 35 L0 35Z" fill="rgba(156,191,168,0.4)" />
                  <path d="M0 24 Q50 16 100 24 Q150 32 200 22 Q250 14 300 22 Q350 30 400 20 L400 35 L0 35Z" fill="rgba(156,191,168,0.2)" />
                </svg>
              </div>
            </div>

            {/* Ticket holes */}
            <div className="flex justify-between px-4 -mt-2.5 relative z-10">
              {Array.from({ length: 11 }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full bg-[#f2f6fa] shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]"
                />
              ))}
            </div>

            {/* Content */}
            <div className="px-5 pb-6">
              {/* Tag row */}
              <div className="flex items-center gap-2.5 my-3">
                <div className="flex-1 h-px bg-[#e8edf2]" />
                <span className="text-[9px] text-ink-ghost tracking-[0.2em]">
                  场 景 入 口
                </span>
                <div className="flex-1 h-px bg-[#e8edf2]" />
              </div>

              {/* Title */}
              <div className="mb-5">
                <h1 className="font-serif text-3xl font-black text-ink tracking-[0.2em] leading-tight mb-2">
                  {scene.title}
                </h1>
                <div className="flex items-center gap-2 text-[10px] text-ink-faint">
                  {scene.tags.map((tag, i) => (
                    <span key={tag} className="flex items-center gap-2">
                      {i > 0 && (
                        <span className="w-0.5 h-0.5 rounded-full bg-brand-blue/30" />
                      )}
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Story description */}
              <div className="py-3 border-y border-[#e8edf2]">
                <p className="font-serif text-sm leading-relaxed text-ink-light text-justify">
                  {scene.description}
                </p>
              </div>

              {/* Opening line */}
              <div className="mt-3 p-3.5 bg-[#eef2f5] rounded-xl border-l-2 border-brand-blue/30">
                <p className="text-xs text-ink-light leading-relaxed italic">
                  <span className="text-ink font-semibold not-italic">
                    {scene.roles[0]?.name}
                  </span>
                  走上前，沉默了两秒。
                  <br />
                  {scene.openingLine}
                </p>
              </div>

              {/* Role tabs */}
              <div className="mt-5">
                <div className="flex gap-0 bg-[#eef2f5] rounded-xl p-0.5 mb-3">
                  {scene.roles.map((role, i) => (
                    <button
                      key={role.name}
                      onClick={() => setActiveRole(i)}
                      className={`flex-1 py-2.5 rounded-[10px] text-center transition-all duration-300 cursor-pointer ${
                        activeRole === i
                          ? 'bg-white shadow-sm'
                          : 'bg-transparent'
                      }`}
                    >
                      <span
                        className={`font-serif text-base font-bold block transition-colors duration-300 ${
                          activeRole === i ? 'text-ink' : 'text-ink-ghost'
                        }`}
                      >
                        {role.name}
                      </span>
                      <span
                        className={`text-[9px] mt-0.5 block transition-colors duration-300 ${
                          activeRole === i
                            ? 'text-brand-blue'
                            : 'text-ink-ghost'
                        }`}
                      >
                        {role.desc}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Role body */}
                {scene.roles.map((role, i) => (
                  <div
                    key={role.name}
                    className={`${activeRole === i ? 'block' : 'hidden'}`}
                  >
                    <p className="text-xs text-ink-light leading-relaxed py-2">
                      你是
                      <span className="text-[#245080] font-bold">
                        {role.name}
                      </span>
                      。{role.identity}
                    </p>
                    <div className="p-3 bg-[#eef2f5] rounded-xl flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8edf2] flex items-center justify-center flex-shrink-0">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="fill-ink-faint"
                        >
                          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] text-brand-blue font-medium">
                          你有一个秘密
                        </div>
                        <div className="text-[10px] text-ink-ghost mt-0.5">
                          {role.secretHint}
                        </div>
                      </div>
                      <span className="text-[8px] text-brand-gold bg-brand-gold/5 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                        对话揭晓
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enter button */}
              <div className="mt-5">
                <button
                  onClick={() => setEntered(!entered)}
                  className="w-full py-4 bg-gradient-to-r from-[#4a8ec8] via-[#3a78b0] to-[#2e64a0] text-white text-sm tracking-widest rounded-2xl transition-all duration-500 shadow-[0_4px_20px_rgba(46,100,160,0.22)] hover:shadow-[0_8px_32px_rgba(46,100,160,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] cursor-pointer"
                >
                  {entered ? '寻找搭档中...' : '接受角色，开始对话'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hints */}
        <div className="mt-5 flex flex-col items-center gap-2 opacity-0 animate-fade-in delay-500">
          <p className="text-[10px] text-ink-ghost/40">
            与一位陌生人共同演绎这个故事
          </p>
          <p className="text-[10px] text-ink-ghost/40">
            对话通常持续 10-20 分钟
          </p>
        </div>
      </div>
    </div>
  );
}
