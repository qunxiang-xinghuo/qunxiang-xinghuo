'use client';

import { useState, useEffect } from 'react';

export interface Reaction {
  id: string;
  brainholeId: string;
  identityLabel: string;
  content: string;
  aiPrompt: string;
  sparkCount: number;
  createdAt: string;
  isSparked: boolean;
}

export function useReaction(brainholeId?: string) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('xh_reactions');
    if (saved) {
      const allReactions: Reaction[] = JSON.parse(saved);
      setReactions(brainholeId ? allReactions.filter(r => r.brainholeId === brainholeId) : allReactions);
    }
    setLoading(false);
  }, [brainholeId]);

  const submitReaction = (reaction: Omit<Reaction, 'id' | 'createdAt' | 'sparkCount' | 'isSparked'>) => {
    const newReaction: Reaction = {
      ...reaction,
      id: 'react-' + Date.now(),
      createdAt: new Date().toISOString(),
      sparkCount: 0,
      isSparked: false,
    };
    
    const saved = localStorage.getItem('xh_reactions');
    const allReactions: Reaction[] = saved ? JSON.parse(saved) : [];
    const updated = [...allReactions, newReaction];
    localStorage.setItem('xh_reactions', JSON.stringify(updated));
    
    setReactions(prev => [...prev, newReaction]);
    return newReaction;
  };

  const toggleSpark = (reactionId: string) => {
    const saved = localStorage.getItem('xh_reactions');
    if (!saved) return;
    
    const allReactions: Reaction[] = JSON.parse(saved);
    const updated = allReactions.map(r => {
      if (r.id === reactionId) {
        return {
          ...r,
          isSparked: !r.isSparked,
          sparkCount: r.isSparked ? r.sparkCount - 1 : r.sparkCount + 1,
        };
      }
      return r;
    });
    
    localStorage.setItem('xh_reactions', JSON.stringify(updated));
    setReactions(prev => prev.map(r => r.id === reactionId ? { ...r, isSparked: !r.isSparked, sparkCount: r.isSparked ? r.sparkCount - 1 : r.sparkCount + 1 } : r));
  };

  return {
    reactions,
    loading,
    submitReaction,
    toggleSpark,
  };
}
