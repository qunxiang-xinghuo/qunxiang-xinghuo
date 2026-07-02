import type { Metadata } from 'next';
import { stories } from '@/lib/data';
import { notFound } from 'next/navigation';
import { StoryReader } from '@/components/story-reader';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const story = stories.find((s) => s.id === id);
  if (!story) return { title: '故事未找到' };
  return {
    title: story.title,
    description: `${story.subtitle} — 来自群像·星火的真实对话`,
  };
}

export async function generateStaticParams() {
  return stories.map((story) => ({ id: story.id }));
}

export default async function StoryDetailPage({ params }: Props) {
  const { id } = await params;
  const story = stories.find((s) => s.id === id);

  if (!story) {
    notFound();
  }

  return <StoryReader story={story!} />;
}
