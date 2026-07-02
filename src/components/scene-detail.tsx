'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Scene } from '@/lib/data';

interface SceneDetailProps {
  scene: Scene;
}

export function SceneDetail({ scene }: SceneDetailProps) {
  const [activeRole, setActiveRole] = useState(0);

  return (
    <div className="opacity-0 animate-ticket-in">
      {/* Back Button */}
      <Link
        href="/scenes"
        className="inline-flex items-center gap-1 text-xs text-ink-faint hover:text-ink-light transition-colors duration-300 tracking-wider mb-8"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回场景库
      </Link>

      {/* Ticket Card */}
      <div className="ticket-card">
        {/* Scenic Window */}
        <div className="relative h-48 sm:h-56 overflow-hidden">
          {/* Sky */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, #c8d8e8 0%, #d8e4f0 30%, #e4ecf4 60%, #eef4f8 100%)',
            }}
          />

          {/* Sun */}
          <div className="absolute top-8 right-12 w-16 h-16 rounded-full bg-white/60 blur-sm" />
          <div className="absolute top-9 right-13 w-14 h-14 rounded-full bg-white/80" />

          {/* Clouds */}
          <div className="absolute top-12 left-8 w-20 h-6 bg-white/50 rounded-full blur-sm" />
          <div className="absolute top-16 left-12 w-16 h-5 bg-white/40 rounded-full blur-sm" />
          <div className="absolute top-8 right-24 w-24 h-7 bg-white/30 rounded-full blur-sm" />

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#a8c8a0] to-[#c8d8b8]" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#90b888]" />

          {/* Plane */}
          <div className="absolute top-16 animate-fly">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                fill="#4a6888"
                opacity="0.6"
              />
            </svg>
          </div>

          {/* Scene Title Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[10px] tracking-[4px] text-ink-faint/80 mb-2">
                {scene.location}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-ink tracking-wider drop-shadow-sm">
                {scene.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {scene.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-3 py-1 rounded-full bg-card-inner text-ink-ghost"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm text-ink-faint text-center leading-relaxed mb-8 max-w-md mx-auto">
            {scene.description}
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-line" />
            <span className="text-[10px] text-ink-ghost tracking-wider">
              角 色
            </span>
            <div className="flex-1 h-px bg-line" />
          </div>

          {/* Role Tabs */}
          <div className="flex gap-2 mb-6">
            {scene.roles.map((role, i) => (
              <button
                key={role.name}
                onClick={() => setActiveRole(i)}
                className={`flex-1 py-2.5 text-xs tracking-wider rounded-xl border transition-all duration-300 ${
                  activeRole === i
                    ? 'border-brand-gold/40 bg-brand-gold/5 text-brand-gold'
                    : 'border-line text-ink-faint hover:border-blue-soft/40 hover:text-ink-light'
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>

          {/* Role Detail */}
          <div className="bg-card-inner rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-bright to-blue-deep flex items-center justify-center text-white text-xs font-bold">
                {scene.roles[activeRole].name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">
                  {scene.roles[activeRole].name}
                </div>
                <div className="text-[10px] text-ink-ghost">
                  {scene.roles[activeRole].identity}
                </div>
              </div>
            </div>
            <p className="text-xs text-ink-light leading-relaxed mb-3">
              {scene.roles[activeRole].desc}
            </p>
            <div className="text-[10px] text-ink-faint">
              <span className="text-ink-ghost">秘密提示：</span>
              {scene.roles[activeRole].secretHint}
            </div>
          </div>

          {/* Secret Hint */}
          <div className="bg-gradient-to-r from-blue-deep/5 to-blue-dark/5 rounded-xl p-4 mb-6 border border-blue-deep/10">
            <div className="flex items-center gap-2 mb-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-blue-deep/60"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-[10px] text-blue-deep/60 tracking-wider">
                秘 密 提 示
              </span>
            </div>
            <p className="text-xs text-ink-faint italic">
              {scene.roles[activeRole].secret}
            </p>
          </div>

          {/* CTA */}
          <button className="w-full py-3.5 bg-gradient-to-r from-blue-deep to-blue-dark text-white text-sm tracking-widest rounded-2xl transition-all duration-500 shadow-[0_4px_20px_rgba(36,80,128,0.22)] hover:shadow-[0_8px_32px_rgba(36,80,128,0.35)] hover:-translate-y-0.5">
            接受角色，开始对话
          </button>
        </div>
      </div>
    </div>
  );
}
