export interface BubbleItem {
  id: string;
  title: string;
  scenario: string;
  hotScore: number;
  category: string;
  difficulty: string;
  source: string;
}

export interface CloudLayout {
  bubbles: (BubbleItem & { x: number; y: number; size: number })[];
  containerWidth: number;
}
