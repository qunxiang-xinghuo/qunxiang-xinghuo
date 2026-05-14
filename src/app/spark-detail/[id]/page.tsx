// v8.0: 火花详情页 — 展示已完结对白的完整消息记录
// v8.3-fix: 改用 Prisma 直接查询，避免生产环境 localhost:3000 不可访问
export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import SparkDetailClient from './SparkDetailClient';

interface SparkDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SparkDetailPage({ params }: SparkDetailPageProps) {
  const { id } = await params;

  try {
    const asset = await db.asset.findFirst({
      where: { id, isPublic: true, deletedByUser: false, deletedByPartner: false },
      include: {
        brainhole: { select: { title: true, category: true, scenario: true } },
        room: {
          include: {
            participants: { select: { identity: true, userId: true, role: true } },
            messages: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true, content: true, identity: true, senderId: true,
                roleCharacter: true, isSpark: true, createdAt: true,
              },
            },
          },
        },
      },
    });

    // v9.3-emergency-fix: 详情页容错 — 如果 Asset 不存在或 room 为空，显示默认文案
    if (!asset) {
      return (
        <div className="min-h-screen bg-xh-primary flex items-center justify-center text-white/60 px-4">
          <div className="text-center">
            <p className="text-lg mb-2">对白记录正在整理中，请稍后查看</p>
            <p className="text-sm text-white/40">记录编号: {id}</p>
          </div>
        </div>
      );
    }

    const participants = asset.room?.participants || [];
    const identities = participants.map((p) => p.identity).filter(Boolean);
    const identityPair = identities.length >= 2
      ? `${identities[0]} × ${identities[1]}`
      : identities[0] || asset.identity || '匿名';

    const data = {
      id: asset.id,
      title: asset.title,
      content: asset.content || asset.summary || '',
      hotScore: asset.hotScore || 0,
      createdAt: asset.createdAt.toISOString(),
      identity: asset.identity || '匿名',
      identityPair,
      brainholeTitle: asset.brainhole?.title || '',
      brainholeCategory: asset.brainhole?.category || '',
      brainholeScenario: asset.brainhole?.scenario || '',
      roomId: asset.roomId,
      roomStatus: asset.room?.status || null,
      closedAt: asset.room?.closedAt?.toISOString() || null,
      messageCount: asset.messageCount || 0,
      sparkCount: asset.sparkCount || 0,
      ownerId: asset.userId,
      messages: (asset.room?.messages || []).map((m) => ({
        id: m.id,
        content: m.content,
        identity: m.identity,
        senderId: m.senderId,
        roleCharacter: m.roleCharacter,
        isSpark: m.isSpark,
        createdAt: m.createdAt.toISOString(),
      })),
    };

    return <SparkDetailClient data={data} />;
  } catch {
    return <div className="h-screen bg-xh-primary flex items-center justify-center text-white/50">加载失败</div>;
  }
}
