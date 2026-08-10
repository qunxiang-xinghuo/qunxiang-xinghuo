"use client";

/**
 * 陌生人匹配页面
 * 用户选择场景后进入匹配队列，等待另一位玩家加入
 * 匹配成功后进入对戏房间
 */

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { scenes } from "@/lib/data";

/**
 * 匹配页面内容组件
 * 处理匹配逻辑和 UI 展示
 */
function MatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sceneId = searchParams.get("sceneId");
  const [status, setStatus] = useState<"idle" | "matching" | "found" | "error">("idle");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 获取场景信息
  const scene = scenes.find((s) => s.id === sceneId);
  const sceneName = scene?.title || "未知场景";
  const roleA = scene?.roles[0]?.name || "角色 A";
  const roleB = scene?.roles[1]?.name || "角色 B";

  // 开始匹配
  const handleStartMatch = async () => {
    if (!sceneId) return;

    setStatus("matching");
    setError(null);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "匹配失败");
      }

      if (data.roomId) {
        setRoomId(data.roomId);
        setStatus("found");
        // 3 秒后跳转到房间
        setTimeout(() => {
          router.push(`/room/${data.roomId}`);
        }, 3000);
      } else {
        // 继续等待匹配
        const timer = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/match?sceneId=${sceneId}`);
            const checkData = await checkRes.json();

            if (checkData.roomId) {
              setRoomId(checkData.roomId);
              setStatus("found");
              clearInterval(timer);
              setTimeout(() => {
                router.push(`/room/${checkData.roomId}`);
              }, 3000);
            }
          } catch (err) {
            console.error("检查匹配状态失败:", err);
          }
        }, 3000);

        // 5 分钟后停止匹配
        setTimeout(() => {
          clearInterval(timer);
          if (status === "matching") {
            setStatus("error");
            setError("匹配超时，请重试");
          }
        }, 300000);
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "匹配失败");
    }
  };

  // 如果没有 sceneId，显示场景选择
  if (!sceneId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0f8ff] to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-serif text-[#1a2e4a] mb-4 text-center">
            选择一个场景开始对戏
          </h1>
          <p className="text-[#4a6888] text-center mb-8">
            每个场景都有一段独特的故事，选择一个你感兴趣的场景
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenes.map((scene) => (
              <Link
                key={scene.id}
                href={`/match?sceneId=${scene.id}`}
                className="bg-white rounded-lg shadow-sm border border-[#e0e8f0] p-6 hover:shadow-md hover:border-[#4a9fd8] transition"
              >
                <h3 className="font-serif text-[#1a2e4a] mb-2">{scene.title}</h3>
                <p className="text-sm text-[#4a6888] mb-3">{scene.description}</p>
                <div className="flex gap-2">
                  {scene.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-[#f0f8ff] text-[#4a9fd8] rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>

          <Link href="/scenes" className="block text-center mt-8 text-[#4a6888] hover:text-[#4a9fd8]">
            ← 返回场景库
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f8ff] to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-serif text-[#1a2e4a] mb-8 text-center">
          陌生人匹配
        </h1>

        {/* 场景信息 */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-[#e0e8f0]">
          <h2 className="font-serif text-[#1a2e4a] mb-2">{sceneName}</h2>
          <p className="text-sm text-[#4a6888]">
            你将扮演：<span className="font-medium">{roleA}</span> 或 <span className="font-medium">{roleB}</span>
          </p>
        </div>

        {/* 匹配状态 */}
        {status === "idle" && (
          <div className="text-center">
            <p className="text-[#4a6888] mb-6">
              点击开始匹配，你将和另一位陌生人一起完成这个故事
            </p>
            <button
              onClick={handleStartMatch}
              className="px-8 py-3 bg-[#4a9fd8] text-white rounded-lg hover:bg-[#3a8fc8] transition"
            >
              开始匹配
            </button>
          </div>
        )}

        {status === "matching" && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a9fd8] mb-4"></div>
            <p className="text-[#4a6888] mb-2">正在寻找另一位玩家...</p>
            <p className="text-sm text-[#8a9db0]">
              提示：每晚 21:00-23:00 是开戏时段，匹配最快
            </p>
          </div>
        )}

        {status === "found" && (
          <div className="text-center">
            <div className="inline-block text-6xl mb-4">🎭</div>
            <p className="text-[#1a2e4a] text-xl mb-2">匹配成功！</p>
            <p className="text-[#4a6888] mb-4">
              房间号：{roomId}
            </p>
            <p className="text-sm text-[#8a9db0]">
              正在进入房间...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleStartMatch}
              className="px-8 py-3 bg-[#4a9fd8] text-white rounded-lg hover:bg-[#3a8fc8] transition"
            >
              重新匹配
            </button>
          </div>
        )}

        {/* 返回链接 */}
        <Link
          href={`/scenes/${sceneId}`}
          className="block text-center mt-8 text-[#4a6888] hover:text-[#4a9fd8]"
        >
          ← 返回场景详情
        </Link>
      </div>
    </div>
  );
}

/**
 * 匹配页面主组件
 * 使用 Suspense 包裹 MatchContent 以支持 useSearchParams
 */
export default function MatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-[#f0f8ff] to-white flex items-center justify-center">
          <p className="text-[#4a6888]">加载中...</p>
        </div>
      }
    >
      <MatchContent />
    </Suspense>
  );
}
