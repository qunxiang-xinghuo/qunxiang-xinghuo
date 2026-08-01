/**
 * @file 知乎集成页面
 * @description 知乎素材搜索和收藏功能
 * 可以从知乎获取创作素材，收藏有价值的内容
 */

'use client';

import { useState, useEffect } from 'react';

interface CollectStats {
  type: string;
  count: number;
}

interface CollectResult {
  collected: number;
  queries: string[];
}

export default function ZhihuCollectPage() {
  const [stats, setStats] = useState<CollectStats[]>([]);
  const [collecting, setCollecting] = useState(false);
  const [result, setResult] = useState<Record<string, CollectResult> | null>(null);
  const [message, setMessage] = useState('');

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/zhihu/collect');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats || []);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 批量采集
  const handleCollect = async (type?: string) => {
    setCollecting(true);
    setResult(null);
    setMessage('');

    try {
      const res = await fetch('/api/zhihu/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          count: 20, // 每种类型采集20个关键词
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResult(data.results);
        setMessage(data.message);
        fetchStats(); // 刷新统计
      } else {
        setMessage('采集失败: ' + data.error);
      }
    } catch (error) {
      setMessage('采集失败: ' + (error as Error).message);
    } finally {
      setCollecting(false);
    }
  };

  // 自动采集（补充不足的数据）
  const handleAutoCollect = async () => {
    setCollecting(true);
    setMessage('正在自动采集...');

    try {
      const res = await fetch('/api/zhihu/collect?action=auto');
      const data = await res.json();
      
      if (data.success) {
        setMessage(data.message);
        // 延迟刷新统计
        setTimeout(fetchStats, 3000);
      }
    } catch (error) {
      setMessage('自动采集失败: ' + (error as Error).message);
    } finally {
      setCollecting(false);
    }
  };

  const totalCount = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f8ff] to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif text-[#1a2e4a] mb-4">
            知乎数据采集
          </h1>
          <p className="text-[#4a6888]">
            采集知乎优质内容，用于 AI 创作素材
          </p>
        </div>

        {/* 统计信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e0e8f0] p-6 mb-8">
          <h2 className="text-lg font-medium text-[#1a2e4a] mb-4">
            数据库统计
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.type} className="text-center p-4 bg-[#f0f8ff] rounded-lg">
                <div className="text-2xl font-bold text-[#4a9fd8]">
                  {s.count}
                </div>
                <div className="text-sm text-[#4a6888] mt-1">
                  {s.type === 'scene' && '场景'}
                  {s.type === 'character' && '角色'}
                  {s.type === 'emotion' && '情感'}
                  {s.type === 'story' && '故事'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-[#e0e8f0] text-center">
            <span className="text-[#4a6888]">总计: </span>
            <span className="text-xl font-bold text-[#4a9fd8]">{totalCount}</span>
            <span className="text-[#4a6888]"> 条素材</span>
          </div>
        </div>

        {/* 采集操作 */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e0e8f0] p-6 mb-8">
          <h2 className="text-lg font-medium text-[#1a2e4a] mb-4">
            采集操作
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              onClick={() => handleCollect()}
              disabled={collecting}
              className="px-4 py-3 bg-[#4a9fd8] text-white rounded-lg hover:bg-[#3a8fc8] disabled:opacity-50 transition-colors"
            >
              全量采集
            </button>
            
            <button
              onClick={() => handleCollect('scene')}
              disabled={collecting}
              className="px-4 py-3 bg-[#7EC8E8] text-white rounded-lg hover:bg-[#6eb8d8] disabled:opacity-50 transition-colors"
            >
              采集场景
            </button>
            
            <button
              onClick={() => handleCollect('character')}
              disabled={collecting}
              className="px-4 py-3 bg-[#5AB0D8] text-white rounded-lg hover:bg-[#4aa0c8] disabled:opacity-50 transition-colors"
            >
              采集角色
            </button>
            
            <button
              onClick={() => handleCollect('emotion')}
              disabled={collecting}
              className="px-4 py-3 bg-[#B0E0E6] text-[#1a2e4a] rounded-lg hover:bg-[#a0d0d6] disabled:opacity-50 transition-colors"
            >
              采集情感
            </button>
            
            <button
              onClick={() => handleCollect('story')}
              disabled={collecting}
              className="px-4 py-3 bg-[#E0F4FF] text-[#1a2e4a] rounded-lg hover:bg-[#d0e4ef] disabled:opacity-50 transition-colors"
            >
              采集故事
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[#e0e8f0]">
            <button
              onClick={handleAutoCollect}
              disabled={collecting}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#4a9fd8] to-[#7EC8E8] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              自动补充采集（数据不足的类型）
            </button>
          </div>

          {message && (
            <div className="mt-4 p-3 bg-[#f0f8ff] rounded-lg text-[#4a6888] text-center">
              {message}
            </div>
          )}
        </div>

        {/* 采集结果 */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm border border-[#e0e8f0] p-6">
            <h2 className="text-lg font-medium text-[#1a2e4a] mb-4">
              采集结果
            </h2>

            <div className="space-y-4">
              {Object.entries(result).map(([type, data]) => (
                <div key={type} className="p-4 bg-[#f0f8ff] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#1a2e4a]">
                      {type === 'scene' && '场景'}
                      {type === 'character' && '角色'}
                      {type === 'emotion' && '情感'}
                      {type === 'story' && '故事'}
                    </span>
                    <span className="text-[#4a9fd8] font-bold">
                      +{data.collected} 条
                    </span>
                  </div>
                  
                  {data.queries.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {data.queries.map((q, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white text-[#4a6888] text-xs rounded"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 说明 */}
        <div className="mt-8 p-6 bg-[#f0f8ff] rounded-lg border border-[#e0e8f0]">
          <h3 className="font-medium text-[#1a2e4a] mb-3">
            使用说明
          </h3>
          <ul className="space-y-2 text-sm text-[#4a6888]">
            <li>• <strong>全量采集</strong>：采集所有类型的素材，每种类型20个关键词</li>
            <li>• <strong>分类采集</strong>：只采集指定类型的素材</li>
            <li>• <strong>自动补充</strong>：检查数据库中不足50条的类型，自动采集补充</li>
            <li>• 采集的数据会保存到数据库，供 AI 创作时作为素材参考</li>
            <li>• 知乎 API 配额有限，请合理使用</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
