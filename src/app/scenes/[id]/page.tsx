import { notFound } from 'next/navigation';
import { getSceneById } from '@/lib/data';
import { SceneDetail } from '@/components/scene-detail';

interface SceneDetailPageProps {
  params: Promise<{ id: string }>;
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
