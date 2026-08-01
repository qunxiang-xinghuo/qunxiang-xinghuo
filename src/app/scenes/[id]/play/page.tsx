/**
 * @file 单人扮演页面
 * @description 用户与 AI 进行单人角色扮演
 * 使用 RolePlaySession 组件实现对话交互
 */

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
