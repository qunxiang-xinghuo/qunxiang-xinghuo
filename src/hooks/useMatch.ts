'use client';

import { useState, useEffect } from 'react';
import { Brainhole } from '@/components/brainhole/BrainholeCard';

export interface Match {
  id: string;
  brainhole: Brainhole;
  partner: {
    id: string;
    name: string;
    identity: string;
    avatar?: string;
  };
  roomId: string;
}

export function useMatch() {
  const [isMatching, setIsMatching] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [countdown, setCountdown] = useState(0);

  const startMatching = (brainhole: Brainhole) => {
    setIsMatching(true);
    setCountdown(3);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Mock match found
          setMatch({
            id: 'match-' + Date.now(),
            brainhole,
            partner: {
              id: 'user-' + Math.random().toString(36).substr(2, 9),
              name: '匿名用户',
              identity: ['设计师', '程序员', '教师', '医生'][Math.floor(Math.random() * 4)],
            },
            roomId: 'room-' + Date.now(),
          });
          setIsMatching(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelMatching = () => {
    setIsMatching(false);
    setCountdown(0);
    setMatch(null);
  };

  return {
    isMatching,
    match,
    countdown,
    startMatching,
    cancelMatching,
  };
}
