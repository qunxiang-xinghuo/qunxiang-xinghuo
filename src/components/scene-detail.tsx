'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import type { Scene } from '@/lib/data';

interface SceneDetailProps {
  scene: Scene;
}

export function SceneDetail({ scene }: SceneDetailProps) {
  const [activeRole, setActiveRole] = useState(0);
  
  // Generate room ID once when component mounts
  const roomId = useMemo(() => `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div className="opacity-0 animate-ticket-in">
      {/* Back Button */}
      <Link
        href="/scenes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-brand-blue transition-colors duration-300 tracking-wide mb-8"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回场景库
      </Link>

      {/* Ticket Card */}
      <div className="ticket-card">
        {/* Scenic Window */}
        <div className="relative h-52 sm:h-64 overflow-hidden">
          {/* Sky */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 30%, #E0F4FF 60%, #F0F8FF 100%)',
            }}
          />

          {/* Sun */}
          <div className="absolute top-10 right-16 w-20 h-20 rounded-full bg-white/50 blur-md" />
          <div className="absolute top-11 right-17 w-18 h-18 rounded-full bg-white/70" />

          {/* Clouds */}
          <div className="absolute top-14 left-10 w-24 h-7 bg-white/40 rounded-full blur-sm" />
          <div className="absolute top-18 left-16 w-20 h-6 bg-white/30 rounded-full blur-sm" />
          <div className="absolute top-10 right-28 w-28 h-8 bg-white/25 rounded-full blur-sm" />

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#4a9fd8] to-[#7EC8E8]" />
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#B0E0E6]" />

          {/* Plane */}
          <div className="absolute top-20 animate-fly">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                fill="#2A7FB8"
                opacity="0.5"
              />
            </svg>
          </div>

          {/* Scene Title Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-transparent to-white/20">
            <div className="text-center">
              <div className="text-[11px] tracking-[4px] text-ink-secondary/70 mb-2">
                {scene.location}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-ink tracking-wider drop-shadow-sm">
                {scene.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-10">
          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {scene.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-3 py-1 rounded-md bg-gray-50 text-ink-secondary"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-base text-ink-secondary text-center leading-relaxed mb-10 max-w-lg mx-auto">
            {scene.description}
          </p>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-ink-muted tracking-[4px]">
              角色
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Role Tabs */}
          <div className="flex gap-3 mb-8">
            {scene.roles.map((role, i) => (
              <button
                key={role.name}
                onClick={() => setActiveRole(i)}
                className={`flex-1 py-3 text-sm tracking-wider rounded-xl border transition-all duration-300 ${
                  activeRole === i
                    ? 'border-brand-gold/40 bg-brand-gold/5 text-brand-gold font-medium'
                    : 'border-border text-ink-secondary hover:border-brand-blue/30 hover:text-brand-blue'
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>

          {/* Role Detail */}
          <div className="bg-gray-50/80 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue-light to-brand-blue flex items-center justify-center text-white text-sm font-bold">
                {scene.roles[activeRole].name[0]}
              </div>
              <div>
                <div className="text-base font-semibold text-ink">
                  {scene.roles[activeRole].name}
                </div>
                <div className="text-[11px] text-ink-muted">
                  {scene.roles[activeRole].identity}
                </div>
              </div>
            </div>
            <p className="text-sm text-ink-secondary leading-relaxed mb-4">
              {scene.roles[activeRole].desc}
            </p>
            <div className="text-sm text-ink-muted">
              <span className="text-ink-secondary font-medium">秘密提示：</span>
              {scene.roles[activeRole].secretHint}
            </div>
          </div>

          {/* Secret Hint */}
          <div className="bg-brand-blue/5 rounded-xl p-5 mb-8 border border-brand-blue/10">
            <div className="flex items-center gap-2 mb-3">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-brand-blue/60"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-[11px] text-brand-blue/70 tracking-[3px]">
                秘密提示
              </span>
            </div>
            <p className="text-sm text-ink-secondary italic leading-relaxed">
              {scene.roles[activeRole].secret}
            </p>
          </div>

          {/* CTA */}
          <Link
            href={`/scenes/${scene.id}/play`}
            className="block w-full py-4 bg-gradient-to-r from-brand-blue to-brand-blue-light text-white text-sm font-medium tracking-widest rounded-xl transition-all duration-300 shadow-lg shadow-brand-blue/20 hover:shadow-xl hover:shadow-brand-blue/30 hover:-translate-y-0.5 text-center mb-3"
          >
            单人模式 - 接受角色，开始对话
          </Link>

          {/* Multiplayer CTA */}
          <Link
            href={`/scenes/${scene.id}/multiplayer?room=${roomId}`}
            className="block w-full py-4 bg-gradient-to-r from-[#7EC8E8] to-[#5AB0D8] text-white text-sm font-medium tracking-widest rounded-xl transition-all duration-300 shadow-lg shadow-[#7EC8E8]/20 hover:shadow-xl hover:shadow-[#7EC8E8]/30 hover:-translate-y-0.5 text-center"
          >
            双人模式 - 邀请好友一起扮演
          </Link>
        </div>
      </div>
    </div>
  );
}
