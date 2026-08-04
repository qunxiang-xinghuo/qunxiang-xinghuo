/**
 * @file 成就系统组件
 * @description 展示用户的创作成就和统计数据
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AchievementProps {
  storiesCreated: number;
  storiesCompleted: number;
  totalRounds: number;
  totalWords: number;
}

/**
 * 成就徽章定义
 */
const ACHIEVEMENTS = [
  { id: "first_story", name: "初次创作", desc: "完成第一篇故事", icon: "🌱", threshold: 1, type: "completed" },
  { id: "story_5", name: "故事收集者", desc: "完成5篇故事", icon: "📚", threshold: 5, type: "completed" },
  { id: "story_10", name: "创作达人", desc: "完成10篇故事", icon: "✨", threshold: 10, type: "completed" },
  { id: "story_50", name: "故事大师", desc: "完成50篇故事", icon: "👑", threshold: 50, type: "completed" },
  { id: "words_1000", name: "千字文", desc: "累计创作1000字", icon: "📝", threshold: 1000, type: "words" },
  { id: "words_5000", name: "万字长歌", desc: "累计创作5000字", icon: "🖋️", threshold: 5000, type: "words" },
  { id: "words_10000", name: "著作等身", desc: "累计创作10000字", icon: "📖", threshold: 10000, type: "words" },
  { id: "rounds_50", name: "对话高手", desc: "累计完成50轮对话", icon: "💬", threshold: 50, type: "rounds" },
  { id: "rounds_100", name: "对谈大师", desc: "累计完成100轮对话", icon: "🎭", threshold: 100, type: "rounds" },
];

export function AchievementSystem({ storiesCreated, storiesCompleted, totalRounds, totalWords }: AchievementProps) {
  // 计算已解锁的成就
  const unlockedAchievements = ACHIEVEMENTS.filter((a) => {
    if (a.type === "completed") return storiesCompleted >= a.threshold;
    if (a.type === "words") return totalWords >= a.threshold;
    if (a.type === "rounds") return totalRounds >= a.threshold;
    return false;
  });

  // 计算下一个待解锁的成就
  const nextAchievement = ACHIEVEMENTS.find((a) => {
    if (a.type === "completed") return storiesCompleted < a.threshold;
    if (a.type === "words") return totalWords < a.threshold;
    if (a.type === "rounds") return totalRounds < a.threshold;
    return false;
  });

  // 计算进度
  const getProgress = (achievement: typeof ACHIEVEMENTS[0]) => {
    if (achievement.type === "completed") return Math.min(100, (storiesCompleted / achievement.threshold) * 100);
    if (achievement.type === "words") return Math.min(100, (totalWords / achievement.threshold) * 100);
    if (achievement.type === "rounds") return Math.min(100, (totalRounds / achievement.threshold) * 100);
    return 0;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>🏆</span>
          创作成就
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 统计数据 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-brand-blue">{storiesCreated}</div>
            <div className="text-xs text-muted-foreground">创建故事</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-brand-green">{storiesCompleted}</div>
            <div className="text-xs text-muted-foreground">完成故事</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-brand-gold">{totalRounds}</div>
            <div className="text-xs text-muted-foreground">对话轮数</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-purple-500">{totalWords}</div>
            <div className="text-xs text-muted-foreground">总字数</div>
          </div>
        </div>

        {/* 已解锁成就 */}
        {unlockedAchievements.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2 text-muted-foreground">已解锁成就</div>
            <div className="flex flex-wrap gap-2">
              {unlockedAchievements.map((a) => (
                <Badge key={a.id} variant="secondary" className="gap-1 px-3 py-1">
                  <span>{a.icon}</span>
                  <span>{a.name}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 下一个成就 */}
        {nextAchievement && (
          <div>
            <div className="text-sm font-medium mb-2 text-muted-foreground">
              下一个成就：{nextAchievement.name}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl">{nextAchievement.icon}</div>
              <div className="flex-1">
                <div className="text-sm">{nextAchievement.desc}</div>
                <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-blue transition-all duration-500"
                    style={{ width: `${getProgress(nextAchievement)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 无成就时的提示 */}
        {unlockedAchievements.length === 0 && !nextAchievement && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            开始创作，解锁你的第一个成就吧！
          </div>
        )}
      </CardContent>
    </Card>
  );
}
