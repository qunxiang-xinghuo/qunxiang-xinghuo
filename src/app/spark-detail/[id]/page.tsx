// v8.0: 火花详情页 — 展示已完结对白的完整消息记录
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import SparkDetailClient from './SparkDetailClient';

interface SparkDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SparkDetailPage({ params }: SparkDetailPageProps) {
  const { id } = await params;

  try {
    const res = await fetch(`http://localhost:3000/api/sparks/${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) return notFound();
      return <div className="h-screen bg-xh-primary flex items-center justify-center text-white/50">加载失败</div>;
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      return notFound();
    }

    return <SparkDetailClient data={json.data} />;
  } catch {
    return <div className="h-screen bg-xh-primary flex items-center justify-center text-white/50">加载失败</div>;
  }
}
