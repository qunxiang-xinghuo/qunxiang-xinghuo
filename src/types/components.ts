import { ReactNode } from "react";

// 基础组件 Props
export interface BaseProps {
  className?: string;
  children?: ReactNode;
}

export interface WithId {
  id: string;
}

// 脑洞卡片组件 Props
export interface BrainholeCardProps {
  brainhole: {
    id: string;
    title: string;
    scenario: string;
    difficulty: "easy" | "medium" | "hard";
    tags: Array<{ id: string; name: string }>;
    reactionCount: number;
    sparkCount: number;
    collectionCount: number;
    isCollected?: boolean;
  };
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onCollect?: () => void;
  onReaction?: () => void;
  showActions?: boolean;
}

// 反应卡片组件 Props
export interface ReactionCardProps {
  reaction: {
    id: string;
    content: string;
    identity: string;
    emotionTag?: string;
    mediaUrl?: string;
    mediaDuration?: number;
    isSpark: boolean;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      level: number;
    };
  };
  onMarkSpark?: () => void;
  showSparkButton?: boolean;
  compact?: boolean;
}

// 房间消息组件 Props
export interface RoomMessageProps {
  message: {
    id: string;
    content: string;
    identity: string;
    roleCharacter?: string;
    isSpark: boolean;
    isAiPrompt: boolean;
    isDirectorNote: boolean;
    senderId: string;
    createdAt: Date;
  };
  isOwnMessage: boolean;
  onMarkSpark?: () => void;
  showSparkButton?: boolean;
}

// 匹配等待组件 Props
export interface MatchWaitingProps {
  matchId: string;
  brainhole: {
    id: string;
    title: string;
    scenario: string;
  };
  identity: string;
  estimatedWaitTime?: number;
  onCancel?: () => void;
  onTimeout?: () => void;
}

// 投票组件 Props
export interface VoteProps {
  vote: {
    id: string;
    question: string;
    options: Array<{
      id: string;
      idx: number;
      text: string;
      voteCount: number;
    }>;
    status: "open" | "closed" | "cancelled";
    totalVotes: number;
    userVote?: number;
    winnerOptionIdx?: number;
  };
  onVote?: (optionIdx: number) => void;
  onClose?: () => void;
  canVote?: boolean;
  canClose?: boolean;
}

// 身份选择组件 Props
export interface IdentitySelectProps {
  identities: Array<{
    id: string;
    label: string;
    verified: boolean;
    createdAt: Date;
  }>;
  selectedIdentity?: string;
  onSelect: (identity: string) => void;
  onCreateNew?: () => void;
  allowCreate?: boolean;
}

// 火花墙组件 Props
export interface SparkWallProps {
  sparks: Array<{
    id: string;
    content: string;
    identity: string;
    timestamp: Date;
    roomId?: string;
    brainholeId: string;
    brainholeTitle: string;
  }>;
  onSelectSpark?: (sparkId: string) => void;
  onGenerateStory?: () => void;
  emptyMessage?: string;
}

// 故事草稿编辑器 Props
export interface StoryDraftEditorProps {
  draft?: {
    id?: string;
    title: string;
    content: string;
    format: "script" | "narrative" | "dialogue";
    sparks?: Array<{
      id: string;
      content: string;
      identity: string;
    }>;
  };
  onSave: (draft: {
    title: string;
    content: string;
    format: "script" | "narrative" | "dialogue";
  }) => void;
  onPublish?: () => void;
  readOnly?: boolean;
}

// 加载状态组件 Props
export interface LoadingProps {
  message?: string;
  size?: "small" | "medium" | "large";
  fullScreen?: boolean;
}

// 错误状态组件 Props
export interface ErrorProps {
  title?: string;
  message: string;
  code?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

// 空状态组件 Props
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 分页组件 Props
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSize?: boolean;
}

// 搜索筛选组件 Props
export interface SearchFilterProps {
  filters: {
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  };
  availableTags: Array<{ id: string; name: string }>;
  onFilterChange: (filters: any) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

// 语音输入组件 Props
export interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  language?: string;
  maxDuration?: number;
  disabled?: boolean;
}

// 媒体上传组件 Props
export interface MediaUploadProps {
  onUploadComplete: (url: string, duration?: number) => void;
  accept?: "audio" | "video" | "image" | "all";
  maxSizeMB?: number;
  maxDuration?: number;
  disabled?: boolean;
}