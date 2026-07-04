import { notFound } from 'next/navigation';
import { getSceneById, scenes } from '@/lib/data';
import { RolePlaySession } from '@/components/roleplay-session';

interface PlayPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return scenes.map((scene) => ({ id: scene.id }));
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { id } = await params;
  const scene = getSceneById(id);

  if (!scene) {
    notFound();
  }

  return <RolePlaySession scene={scene} />;
}
