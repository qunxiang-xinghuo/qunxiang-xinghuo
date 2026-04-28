'use client';

import TopBar from '@/components/layout/TopBar';
import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="消息中心" />

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">暂无消息</p>
          <p className="text-gray-600 text-xs mt-1">匹配成功、收到火花会在这里通知你</p>
        </div>
      </div>
    </div>
  );
}
