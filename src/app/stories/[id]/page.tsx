import { notFound } from 'next/navigation';
import { getStoryById, stories } from '@/lib/data';
import { StoryReader } from '@/components/story-reader';

interface StoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return stories.map((story) => ({ id: story.id }));
}

export async function generateMetadata({ params }: StoryDetailPageProps) {
  const { id } = await params;
  const story = getStoryById(id);
  if (!story) return { title: '故事不存在' };
  return {
    title: `${story.title} - 故事集`,
    description: story.description,
  };
}

export default async function StoryDetailPage({ params }: StoryDetailPageProps) {
  const { id } = await params;
  const story = getStoryById(id);

  if (!story) {
    notFound();
  }

  return (
    <div className="site-bg">
      <StoryReader story={story} />
    </div>
  );
}
