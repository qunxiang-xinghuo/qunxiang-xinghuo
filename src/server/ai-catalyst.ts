import { db } from "@/lib/db";
import { getFallbackPrompt } from "@/lib/ai/fallback-prompts";

export async function getCatalystPrompt(brainholeId: string): Promise<string | null> {
  try {
    // 获取脑洞详情
    const brainhole = await db.brainhole.findUnique({
      where: { id: brainholeId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!brainhole) {
      return null;
    }

    // 提取标签
    const tags = brainhole.tags.map((bt) => bt.tag.name);
    
    // 根据难度和标签获取提示
    let category = "general";
    
    // 根据标签确定分类
    if (tags.some((tag: string) => ["医疗", "医生", "护士", "急诊", "手术"].includes(tag))) {
      category = "medical";
    } else if (tags.some((tag: string) => ["法律", "律师", "法庭", "合同"].includes(tag))) {
      category = "legal";
    } else if (tags.some((tag: string) => ["教育", "老师", "学生", "教学"].includes(tag))) {
      category = "education";
    } else if (tags.some((tag: string) => ["服务", "客服", "餐饮", "酒店"].includes(tag))) {
      category = "service";
    } else if (tags.some((tag: string) => ["技术", "编程", "软件", "系统"].includes(tag))) {
      category = "technical";
    } else if (tags.some((tag: string) => ["生活", "家庭", "社交", "情感"].includes(tag))) {
      category = "daily";
    }

    // 根据难度调整问题复杂度
    let prompt = getFallbackPrompt(category, tags);
    
    // 调整提示以匹配难度
    if (brainhole.difficulty === "easy") {
      prompt = `这是一个相对简单的情境：${prompt}`;
    } else if (brainhole.difficulty === "hard") {
      prompt = `这是一个复杂且有挑战性的情境：${prompt}`;
    }

    return prompt;
  } catch (error) {
    console.error("Failed to get catalyst prompt:", error);
    return null;
  }
}

export async function generateCatalystFromHistory(
  brainholeId: string,
  userId: string
): Promise<string | null> {
  try {
    // 获取用户对该脑洞的历史反应
    const userReactions = await db.reaction.findMany({
      where: {
        brainholeId,
        userId,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (userReactions.length === 0) {
      return null;
    }

    // 分析反应模式
    const lastReaction = userReactions[0];
    const hasSpark = userReactions.some((r) => r.isSpark);
    
    // 基于历史生成个性化提示
    let basePrompt = getFallbackPrompt();
    
    if (hasSpark) {
      basePrompt = `基于你之前标记的火花，继续深入这个方向：${basePrompt}`;
    } else {
      basePrompt = `尝试从不同角度思考：${basePrompt}`;
    }

    return basePrompt;
  } catch (error) {
    console.error("Failed to generate catalyst from history:", error);
    return null;
  }
}