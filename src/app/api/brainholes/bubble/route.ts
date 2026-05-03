import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { apiResponse } from "@/lib/utils";

// v6.0: 简化版日常场景脑洞（50字以内）
const SIMPLE_BRAINHOLES = [
  { id: "fb-daily-001", title: "深夜便利店", category: "日常", difficulty: "easy", scene: "凌晨两点，你走进一家24小时便利店，发现收银员在偷偷抹眼泪。", hotScore: 128 },
  { id: "fb-daily-002", title: "地铁上遇到奇怪的人", category: "日常", difficulty: "easy", scene: "早高峰地铁里，旁边的人突然开始对着空气说话。", hotScore: 115 },
  { id: "fb-daily-003", title: "邻居家的快递", category: "日常", difficulty: "easy", scene: "你错拿了邻居的快递，打开后发现里面是一封手写信。", hotScore: 98 },
  { id: "fb-daily-004", title: "最后一班公交", category: "日常", difficulty: "easy", scene: "末班公交车上，司机突然问你：你相信下一站不存在吗？", hotScore: 142 },
  { id: "fb-daily-005", title: "下雨天没带伞", category: "日常", difficulty: "easy", scene: "暴雨突降，你被困在公交站，一个陌生人把伞塞给你就跑。", hotScore: 105 },
  { id: "fb-daily-006", title: "餐厅里认错人", category: "日常", difficulty: "easy", scene: "你在餐厅拍了拍陌生人的肩膀，对方转过头来竟然和你长得一模一样。", hotScore: 156 },
  { id: "fb-daily-007", title: "电梯里的沉默", category: "日常", difficulty: "easy", scene: "电梯里只有你和一个人，他突然说：你终于来了。", hotScore: 132 },
  { id: "fb-daily-008", title: "超市试吃员", category: "日常", difficulty: "easy", scene: "超市试吃员递给你一小块蛋糕，低声说：这是最后一次了。", hotScore: 89 },
  { id: "fb-daily-009", title: "旧手机里的短信", category: "日常", difficulty: "easy", scene: "你翻到旧手机，发现有一条来自未来的未读短信。", hotScore: 167 },
  { id: "fb-daily-010", title: "外卖骑手的心事", category: "日常", difficulty: "easy", scene: "外卖送到时，骑手恳求你：能帮我看一下这封信吗？", hotScore: 120 },
  { id: "fb-daily-011", title: "公园长椅上的书", category: "日常", difficulty: "easy", scene: "公园长椅上放着一本书，翻开发现每一页都写满了给你的留言。", hotScore: 143 },
  { id: "fb-daily-012", title: "理发店的镜子", category: "日常", difficulty: "easy", scene: "理发时，镜子里你的倒影比你自己慢了半秒。", hotScore: 178 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 30);

    // v6.0: 先尝试从数据库获取有效的日常脑洞（排除旧临时ID）
    const existing = await prisma.brainhole.findMany({
      where: {
        AND: [
          { id: { not: { startsWith: "ds-" } } },
          { id: { not: { startsWith: "zh-hot-" } } },
          { id: { not: { startsWith: "zh-search-" } } },
          { id: { not: { startsWith: "temp-" } } },
        ],
      },
      orderBy: [{ hotScore: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    // 如果数据库有足够数据，直接返回
    if (existing.length >= Math.min(limit, 8)) {
      return NextResponse.json(apiResponse({ list: existing }));
    }

    // v6.0: 补充简化版日常脑洞
    const missingCount = limit - existing.length;
    const fallback = SIMPLE_BRAINHOLES.slice(0, missingCount);

    // 持久化新的fallback数据
    for (const item of fallback) {
      try {
        await prisma.brainhole.upsert({
          where: { id: item.id },
          update: { hotScore: item.hotScore },
          create: { 
            id: item.id,
            title: item.title,
            category: item.category,
            difficulty: item.difficulty,
            scenario: item.scene,
            hotScore: item.hotScore,
            status: "approved",
          },
        });
      } catch (e) {
        // 忽略唯一键冲突
      }
    }

    const all = [...existing, ...fallback];
    return NextResponse.json(apiResponse({ list: all }));
  } catch (error) {
    console.error("[Bubble API] Error:", error);
    return NextResponse.json(apiResponse({ list: SIMPLE_BRAINHOLES.slice(0, 10) }));
  }
}
