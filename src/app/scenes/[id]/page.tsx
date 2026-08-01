/**
 * @file 场景详情页面
 * @description 展示单个场景的详细信息
 * 包括场景描述、角色设定、单人/双人创作入口
 */

import { notFound } from 'next/navigation';
import { getSceneById, scenes } from '@/lib/data';
import { SceneDetail } from '@/components/scene-detail';

interface SceneDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return scenes.map((scene) => ({ id: scene.id }));
}

export async function generateMetadata({ params }: SceneDetailPageProps) {
  const { id } = await params;
  const scene = getSceneById(id);
  if (!scene) return { title: '场景不存在' };
  return {
    title: `${scene.title} - 场景库`,
    description: scene.description,
  };
}

export default async function SceneDetailPage({ params }: SceneDetailPageProps) {
  const { id } = await params;
  const scene = getSceneById(id);

  if (!scene) {
    notFound();
  }

  return (
    <div className="site-bg px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <SceneDetail scene={scene} />
      </div>
    </div>
  );
}
