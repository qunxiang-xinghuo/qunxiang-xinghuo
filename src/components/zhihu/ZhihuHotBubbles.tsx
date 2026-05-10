"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, ExternalLink } from "lucide-react";

interface HotItem {
  Title: string;
  Url: string;
  ThumbnailUrl: string;
  Summary: string;
}

export default function ZhihuHotBubbles() {
  const [items, setItems] = useState<HotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch("/api/zhihu/hot-list?limit=10")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setItems(res.data.items.slice(0, 8));
        } else {
          setError("热榜加载失败");
        }
      })
      .catch(() => setError("热榜加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-xh-yellow" />
          <span className="text-xs text-gray-400">知乎热榜加载中...</span>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-32 rounded-full bg-white/5 animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || items.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-xh-yellow" />
        <span className="text-xs font-medium text-xh-gold-light">
          知乎热榜 · 实时脑洞素材
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item, idx) => (
          <motion.a
            key={idx}
            href={item.Url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 group"
            initial={mounted ? { opacity: 0, scale: 0.9 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative h-16 px-4 rounded-full flex items-center gap-2
              bg-gradient-to-r from-xh-gold/10 to-xh-gold-dark/10
              border border-xh-gold/20 backdrop-blur-sm
              hover:border-xh-gold/40 transition-colors
              max-w-[200px]"
            >
              <span className="text-xs font-bold text-xh-gold w-4 flex-shrink-0">
                {idx + 1}
              </span>
              <span className="text-xs text-gray-200 truncate leading-tight">
                {item.Title}
              </span>
              <ExternalLink className="w-3 h-3 text-xh-gold/60 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
