/**
 * 泡泡云布局引擎
 * 力导向布局 + 聚类 + 热度驱动
 */

export interface BubbleData {
  id: string;
  title: string;
  scenario: string;
  difficulty: string;
  hotScore: number;
  category: string;
  bubbleColor: string | null;
  reactionCount: number;
  sparkCount: number;
  collectionCount: number;
  isNew?: boolean;
  isParticipated?: boolean;
  isTrending?: boolean;
}

export interface BubblePosition {
  id: string;
  x: number; // 0-1 相对坐标
  y: number; // 0-1 相对坐标
  size: number; // px
  color: string;
  glowColor: string;
  opacity: number;
  zIndex: number;
  floatDelay: number;
  floatAmplitude: number;
}

// 分类聚类中心（相对坐标）
const CLUSTER_CENTERS: Record<string, { x: number; y: number }> = {
  medical: { x: 0.2, y: 0.2 },
  legal: { x: 0.8, y: 0.2 },
  workplace: { x: 0.8, y: 0.5 },
  life: { x: 0.2, y: 0.5 },
  education: { x: 0.35, y: 0.75 },
  tech: { x: 0.65, y: 0.75 },
  emergency: { x: 0.5, y: 0.35 },
  general: { x: 0.5, y: 0.5 },
};

// 分类颜色映射
const CATEGORY_COLORS: Record<string, string> = {
  medical: '#e74c3c',
  legal: '#3498db',
  workplace: '#f39c12',
  life: '#2ecc71',
  education: '#9b59b6',
  tech: '#1abc9c',
  emergency: '#e67e22',
  general: '#95a5a6',
};

/**
 * 热度驱动大小计算
 * hotScore 0-100 -> size 60-180px
 */
export function calculateBubbleSize(hotScore: number): number {
  const minSize = 60;
  const maxSize = 160;
  return minSize + (hotScore / 100) * (maxSize - minSize);
}

/**
 * 计算泡泡不透明度
 * 新上架更不透明
 */
export function calculateBubbleOpacity(isNew: boolean, hotScore: number): number {
  const baseOpacity = 0.7 + (hotScore / 100) * 0.3;
  return isNew ? Math.min(1, baseOpacity + 0.1) : baseOpacity;
}

/**
 * 计算发光颜色
 */
export function calculateGlowColor(baseColor: string, hotScore: number): string {
  // 解析 hex 颜色
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  const alpha = 0.2 + (hotScore / 100) * 0.4;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 力导向布局计算
 */
export function calculateBubblePositions(
  bubbles: BubbleData[],
  containerWidth: number,
  containerHeight: number
): BubblePosition[] {
  const positions: BubblePosition[] = [];
  const padding = 40; // 边距
  const effectiveWidth = containerWidth - padding * 2;
  const effectiveHeight = containerHeight - padding * 2;

  // 按分类分组
  const categoryGroups: Record<string, BubbleData[]> = {};
  for (const bubble of bubbles) {
    const cat = bubble.category || 'general';
    if (!categoryGroups[cat]) categoryGroups[cat] = [];
    categoryGroups[cat].push(bubble);
  }

  // 对每个分类组内的泡泡进行布局
  let globalIndex = 0;
  for (const [category, groupBubbles] of Object.entries(categoryGroups)) {
    const center = CLUSTER_CENTERS[category] || CLUSTER_CENTERS.general;
    
    // 按热度排序，热度高的放中心
    const sorted = [...groupBubbles].sort((a, b) => b.hotScore - a.hotScore);
    
    for (let i = 0; i < sorted.length; i++) {
      const bubble = sorted[i];
      const size = calculateBubbleSize(bubble.hotScore);
      const color = bubble.bubbleColor || CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
      
      // 基于中心的螺旋分布
      const angle = (i * 137.5 * Math.PI) / 180; // 黄金角
      const radius = Math.sqrt(i + 1) * 0.08; // 螺旋半径
      
      // 添加一些随机扰动，让布局更自然
      const randomOffsetX = (Math.random() - 0.5) * 0.05;
      const randomOffsetY = (Math.random() - 0.5) * 0.05;
      
      let x = center.x + Math.cos(angle) * radius + randomOffsetX;
      let y = center.y + Math.sin(angle) * radius + randomOffsetY;
      
      // 边界约束
      const margin = size / Math.min(containerWidth, containerHeight);
      x = Math.max(margin, Math.min(1 - margin, x));
      y = Math.max(margin, Math.min(1 - margin, y));
      
      positions.push({
        id: bubble.id,
        x,
        y,
        size,
        color,
        glowColor: calculateGlowColor(color, bubble.hotScore),
        opacity: calculateBubbleOpacity(bubble.isNew || false, bubble.hotScore),
        zIndex: Math.round(bubble.hotScore),
        floatDelay: globalIndex * 0.3,
        floatAmplitude: 6 + (bubble.hotScore / 100) * 10,
      });
      
      globalIndex++;
    }
  }

  // 简单的碰撞检测和解决（迭代几次）
  for (let iteration = 0; iteration < 5; iteration++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const p1 = positions[i];
        const p2 = positions[j];
        
        const dx = (p2.x - p1.x) * effectiveWidth;
        const dy = (p2.y - p1.y) * effectiveHeight;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (p1.size + p2.size) / 2 + 10;
        
        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          const pushX = (dx / distance) * overlap * 0.5 / effectiveWidth;
          const pushY = (dy / distance) * overlap * 0.5 / effectiveHeight;
          
          p1.x -= pushX;
          p1.y -= pushY;
          p2.x += pushX;
          p2.y += pushY;
          
          // 边界约束
          const margin1 = p1.size / Math.min(containerWidth, containerHeight);
          const margin2 = p2.size / Math.min(containerWidth, containerHeight);
          p1.x = Math.max(margin1, Math.min(1 - margin1, p1.x));
          p1.y = Math.max(margin1, Math.min(1 - margin1, p1.y));
          p2.x = Math.max(margin2, Math.min(1 - margin2, p2.x));
          p2.y = Math.max(margin2, Math.min(1 - margin2, p2.y));
        }
      }
    }
  }

  return positions;
}

/**
 * 热度计算算法
 */
export interface HotScoreInput {
  reactionCount: number;
  sparkCount: number;
  roomCount: number;
  createdAt: Date;
  avgReactionLength?: number;
  identityDiversity?: number;
}

export function calculateHotScore(input: HotScoreInput): number {
  // 基础热度
  const reactionScore = Math.min(input.reactionCount * 5, 30); // 权重30%
  const sparkScore = Math.min(input.sparkCount * 8, 25); // 权重25%
  const roomScore = Math.min(input.roomCount * 5, 15); // 权重15%
  
  // 时间衰减
  const hoursSinceCreated = (Date.now() - input.createdAt.getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 15 - hoursSinceCreated * 0.1); // 权重15%
  
  // 质量指标
  const qualityScore = Math.min((input.avgReactionLength || 50) / 5, 10); // 权重10%
  const diversityScore = Math.min((input.identityDiversity || 1) * 2, 5); // 权重5%
  
  const total = reactionScore + sparkScore + roomScore + recencyScore + qualityScore + diversityScore;
  return Math.min(100, Math.round(total));
}

/**
 * 获取分类显示名称
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    medical: '医疗',
    legal: '法律',
    workplace: '职场',
    life: '生活',
    education: '教育',
    tech: '技术',
    emergency: '紧急',
    general: '综合',
  };
  return labels[category] || category;
}

/**
 * 获取难度标签
 */
export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return labels[difficulty] || difficulty;
}

/**
 * 获取难度颜色
 */
export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: '#2ecc71',
    medium: '#f39c12',
    hard: '#e74c3c',
  };
  return colors[difficulty] || '#95a5a6';
}
