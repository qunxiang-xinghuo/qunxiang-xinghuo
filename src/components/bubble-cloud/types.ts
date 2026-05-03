export interface BubbleItem {
  id: string;
  title: string;
  scenario: string;
  hotScore: number;
  category: string;
  difficulty: string;
  source: string;
  matchCount?: number;     // 匹配人数
  reactionCount?: number;  // 反应人数
  engagedCount?: number;   // 总参与人数（显示用）
}

export interface CloudLayout {
  bubbles: (BubbleItem & { x: number; y: number; size: number })[];
  containerWidth: number;
}
