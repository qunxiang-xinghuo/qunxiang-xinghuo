#!/bin/bash

# 群像·星火 - 房间定时清理脚本
# 功能：清理 24 小时前过期的房间
# 执行频率：每小时执行一次

cd /home/ubuntu/qunxiang-xinghuo

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始清理过期房间..."

# 使用 Prisma 清理过期房间
pnpm tsx -e "
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupExpiredRooms() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // 查找过期房间
  const expiredRooms = await prisma.room.findMany({
    where: {
      createdAt: {
        lt: oneDayAgo
      },
      status: {
        in: ['waiting', 'active']
      }
    },
    include: {
      messages: true
    }
  });
  
  console.log(\`找到 \${expiredRooms.length} 个过期房间\`);
  
  // 删除过期房间的消息
  for (const room of expiredRooms) {
    await prisma.message.deleteMany({
      where: {
        roomId: room.id
      }
    });
    
    // 删除房间
    await prisma.room.delete({
      where: {
        id: room.id
      }
    });
    
    console.log(\`已清理房间：\${room.id} (\${room.scene})\`);
  }
  
  console.log('清理完成！');
  await prisma.\$disconnect();
}

cleanupExpiredRooms().catch(console.error);
"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 清理完成"
