'use client';

import { useState } from 'react';

interface TagFilterProps {
  tags: string[];
  onTagChange?: (selectedTags: string[]) => void;
}

export default function TagFilter({ tags, onTagChange }: TagFilterProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    const newSelected = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newSelected);
    onTagChange?.(newSelected);
  };

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 py-4">
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedTags.includes(tag)
              ? 'bg-xh-gold text-xh-primary'
              : 'bg-xh-gold/15 text-xh-gold border border-xh-gold/30 hover:bg-xh-btn/25'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
