'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';
import { MessageSquare, Sparkles, Clock, Flame, ArrowLeft } from 'lucide-react';

interface RoomMessage {
  id: string;
  content: string;
  identity: string;
  isSpark: boolean;
  createdAt: string;
  senderId: string;
}

interface AssetDetail {
  id: string;
  title: string;
  summary: string;
  messageCount: number;
  sparkCount: number;
  isPublic: boolean;
  createdAt: string;
  brainhole?: { title: string; scenario: string } | null;
  room?: {
    messages: RoomMessage[];
    participants: { userId: string; identity: string }[];
  } | null;
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/assets/${assetId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.asset) {
          setAsset(res.data.asset);
        } else {
          setError(res.error?.message || '加载失败');
        }
      })
      .catch(() => setError('网络错误'))
      .finally(() => setLoading(false));
  }, [assetId]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full page-gradient">
        <TopBar title="素材详情" showBack onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-xh-gold rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex flex-col h-full page-gradient">
        <TopBar title="素材详情" showBack onBack={() => router.back()} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-white/40 text-sm">{error || '素材不存在'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 flex items-center gap-1 text-xs text-xh-gold hover:opacity-80"
          >
            <ArrowLeft className="w-3 h-3" />
            返回素材库
          </button>
        </div>
      </div>
    );
  }

  const messages = asset.room?.messages || [];

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="素材详情" showBack onBack={() => router.back()} />

      {/* 素材信息卡 */}
      <div className="shrink-0 px-4 py-3 bg-xh-gold/10 border-b border-xh-gold/20">
        <div className="flex items-start gap-2">
          <Sparkles className="w-5 h-5 text-xh-gold mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-xh-gold truncate">{asset.title}</h3>
            {asset.summary && (
              <p className="text-[11px] text-xh-gold/60 mt-0.5 line-clamp-2">{asset.summary}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-white/30">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(asset.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {asset.messageCount} 条对白
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-xh-gold" />
                {asset.sparkCount} 火花
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 对白记录 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-2" />
            <p className="text-white/30 text-xs">暂无对白记录</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId !== 'liu_kanshan_ai';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <span className={`text-[10px] text-white/30 ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.identity || (isMe ? '我' : '刘看山')}
                  </span>
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'bg-xh-gold/15 text-white rounded-tr-none border border-xh-gold/20'
                        : 'bg-white/5 text-white rounded-tl-none border border-white/[0.08]'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/25">{formatTime(msg.createdAt)}</span>
                    {msg.isSpark && (
                      <span className="flex items-center gap-0.5 text-[10px] text-xh-gold">
                        <Flame className="w-3 h-3 fill-xh-gold" />
                        火花
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
