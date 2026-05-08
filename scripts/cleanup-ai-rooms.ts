/**
 * 清理僵尸 AI 房间脚本
 * v8.1: 关闭创建时间超过1小时且仍为 active 的 AI 房间
 *
 * 使用方法:
 * npx tsx scripts/cleanup-ai-rooms.ts
 */
import { db } from "@/lib/db";

async function cleanupAiRooms() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const zombieRooms = await db.room.findMany({
    where: {
      isAiRoom: true,
      status: { not: "closed" },
      createdAt: { lt: oneHourAgo },
    },
    select: { id: true, createdAt: true },
  });

  console.log(`[Cleanup] 发现 ${zombieRooms.length} 个僵尸 AI 房间`);

  for (const room of zombieRooms) {
    try {
      await db.room.update({
        where: { id: room.id },
        data: { status: "closed", closedAt: new Date() },
      });
      console.log(`[Cleanup] 已关闭房间: ${room.id} (创建于 ${room.createdAt.toISOString()})`);
    } catch (err: any) {
      console.error(`[Cleanup] 关闭房间失败: ${room.id}`, err.message);
    }
  }

  console.log("[Cleanup] 清理完成");
}

cleanupAiRooms()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[Cleanup] 脚本执行失败:", err);
    process.exit(1);
  });
