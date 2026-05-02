export interface BubbleItem {
  id: string;
  text: string;
  type: 'story' | 'duo-match' | 'material';
  hotScore: number;
}

export interface CloudLayout {
  bubbles: (BubbleItem & { x: number; y: number; size: number })[];
  containerWidth: number;
}
