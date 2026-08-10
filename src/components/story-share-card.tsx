/**
 * @file story-share-card.tsx
 * @description 故事分享卡片组件 - 生成可分享的精美卡片图片
 * 用于将故事内容转换为适合社交媒体分享的卡片格式
 */

'use client';

import { useRef } from 'react';

/**
 * 分享卡片组件属性
 */
interface StoryShareCardProps {
  scene?: string;
  roleAName?: string;
  roleBName?: string;
  goldenQuote?: string;
  lingeringMood?: string;
  onClose?: () => void;
}

/**
 * 故事分享卡片组件
 * 生成适合小红书/朋友圈/微博分享的卡片
 */
export function StoryShareCard({ scene, roleAName, roleBName, goldenQuote, lingeringMood, onClose }: StoryShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6">
      {/* 卡片预览 */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-[#f0f8ff] to-white rounded-2xl p-8 border border-[#e0e8f0] shadow-lg"
        style={{ aspectRatio: '3/4' }}
      >
        {/* 顶部装饰 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-xs text-[#8a9db0]">群像·星火</div>
          <div className="text-xs text-[#8a9db0]">qunxiangxinghuo.cn</div>
        </div>

        {/* 场景标签 */}
        {scene && (
          <div className="inline-block px-3 py-1 bg-[#4a9fd8]/10 text-[#4a9fd8] rounded-full text-xs mb-4">
            {scene}
          </div>
        )}

        {/* 角色信息 */}
        {roleAName && roleBName && (
          <h2 className="text-2xl font-serif text-[#1a2e4a] mb-4 leading-tight">
            {roleAName} × {roleBName}
          </h2>
        )}

        {/* 金句高亮 */}
        {goldenQuote && (
          <div className="border-l-2 border-[#4a9fd8] pl-4 mb-6">
            <p className="text-sm text-[#1a2e4a] italic leading-relaxed">
              {goldenQuote}
            </p>
          </div>
        )}

        {/* 余韵 */}
        {lingeringMood && (
          <p className="text-sm text-[#4a6888] leading-relaxed mb-6">
            {lingeringMood}
          </p>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between mt-auto pt-6 border-t border-[#e0e8f0]">
          <div className="text-xs text-[#8a9db0]">
            刚刚完成 · 双人即兴创作
          </div>
          <div className="text-xs text-[#8a9db0]">
            ✨ 群像·星火
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (!cardRef.current) return;
            alert('请截图保存分享卡片\n\n提示：可以使用手机/电脑的截图功能');
          }}
          className="flex-1 py-2 px-4 bg-[#4a9fd8] text-white rounded-lg hover:bg-[#3a8fc8] transition text-sm"
        >
          📱 截图分享
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="py-2 px-4 border border-[#e0e8f0] text-[#4a6888] rounded-lg hover:bg-[#f0f8ff] transition text-sm"
          >
            关闭
          </button>
        )}
      </div>

      {/* 分享提示 */}
      <div className="text-xs text-[#8a9db0] space-y-1">
        <p>💡 分享建议：</p>
        <p>• 小红书：截图卡片 + 添加话题 #群像星火 #即兴创作 #双人写作</p>
        <p>• 朋友圈：截图卡片 + 一句话感受</p>
        <p>• 微博：截图卡片 + @群像星火</p>
      </div>
    </div>
  );
}
