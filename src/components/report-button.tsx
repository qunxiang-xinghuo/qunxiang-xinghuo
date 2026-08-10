'use client';

/**
 * 举报按钮组件
 * 用于故事页面、对话页面等需要举报功能的地方
 */

import { useState } from 'react';
import { Flag, X } from 'lucide-react';

interface ReportButtonProps {
  targetType: 'story' | 'room' | 'message';
  targetId: string;
  className?: string;
}

// 举报原因选项
const REASON_OPTIONS = [
  { value: 'porn', label: '色情内容' },
  { value: 'violence', label: '暴力血腥' },
  { value: 'harassment', label: '骚扰谩骂' },
  { value: 'spam', label: '垃圾广告' },
  { value: 'other', label: '其他原因' },
];

export function ReportButton({ targetType, targetId, className = '' }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 提交举报
  const handleSubmit = async () => {
    if (!selectedReason) {
      alert('请选择举报原因');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: selectedReason,
          description: description || undefined,
          reporterEmail: email || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        // 3 秒后关闭弹窗
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          setSelectedReason('');
          setDescription('');
          setEmail('');
        }, 3000);
      } else {
        alert(data.error || '举报提交失败');
      }
    } catch (error) {
      console.error('举报提交失败:', error);
      alert('举报提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 举报按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ${className}`}
        title="举报违规内容"
      >
        <Flag className="w-4 h-4" />
        <span>举报</span>
      </button>

      {/* 举报弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 relative">
            {/* 关闭按钮 */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {isSuccess ? (
              // 成功提示
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">举报已提交</h3>
                <p className="text-sm text-muted-foreground">
                  我们会尽快审核处理，感谢您的反馈
                </p>
              </div>
            ) : (
              // 举报表单
              <>
                <h3 className="text-lg font-medium text-foreground mb-4">举报违规内容</h3>

                {/* 举报原因 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    举报原因 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {REASON_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={option.value}
                          checked={selectedReason === option.value}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm text-foreground">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 详细描述 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    详细描述（可选）
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="请描述违规情况..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* 联系邮箱 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    联系邮箱（可选）
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="用于接收处理结果通知"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* 提交按钮 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
                    disabled={isSubmitting}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !selectedReason}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '提交中...' : '提交举报'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
