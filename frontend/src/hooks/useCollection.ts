'use client';

import { useState, useEffect } from 'react';
import { Brainhole } from '@/components/brainhole/BrainholeCard';

export function useCollection() {
  const [collectedBrainholes, setCollectedBrainholes] = useState<Brainhole[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('xh_collections');
    if (saved) {
      setCollectedBrainholes(JSON.parse(saved));
    }
  }, []);

  const saveCollections = (collections: Brainhole[]) => {
    setCollectedBrainholes(collections);
    localStorage.setItem('xh_collections', JSON.stringify(collections));
  };

  const collectBrainhole = (brainhole: Brainhole) => {
    const exists = collectedBrainholes.some(b => b.id === brainhole.id);
    if (!exists) {
      const newCollections = [...collectedBrainholes, brainhole];
      saveCollections(newCollections);
    }
  };

  const uncollectBrainhole = (id: string) => {
    const newCollections = collectedBrainholes.filter(b => b.id !== id);
    saveCollections(newCollections);
  };

  const isCollected = (id: string) => {
    return collectedBrainholes.some(b => b.id === id);
  };

  return {
    collectedBrainholes,
    collectBrainhole,
    uncollectBrainhole,
    isCollected,
  };
}
