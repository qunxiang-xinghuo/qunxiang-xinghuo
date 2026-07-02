import type { Metadata } from 'next';
import Link from 'next/link';
import { scenes } from '@/lib/data';
import { notFound } from 'next/navigation';
import { SceneDetail } from '@/components/scene-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const scene = scenes.find((s) => s.id === id);
  if (!scene) return { title: '场景未找到' };
  return {
    title: scene.title,
    description: scene.description,
  };
}

export async function generateStaticParams() {
  return scenes.map((scene) => ({ id: scene.id }));
}

export default async function SceneDetailPage({ params }: Props) {
  const { id } = await params;
  const scene = scenes.find((s) => s.id === id);

  if (!scene) {
    notFound();
  }

  return (
    <div className="theater-bg pt-14 min-h-screen">
      <div className="px-4 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <Link
            href="/scenes"
            className="inline-flex items-center gap-1.5 text-xs text-ink-faint/50 hover:text-brand-gold transition-colors duration-300 tracking-wider"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回场景库
          </Link>
        </div>
      </div>
      <SceneDetail scene={scene!} />
    </div>
  );
}
