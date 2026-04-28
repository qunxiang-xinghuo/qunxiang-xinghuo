// 用户相关类型
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  level: number;
  sparkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserIdentity {
  id: string;
  userId: string;
  label: string;
  verified: boolean;
  createdAt: Date;
}

// 标签系统
export interface Tag {
  id: string;
  name: string;
  category: string | null;
  createdAt: Date;
}

// 脑洞（冲突情境）
export interface Brainhole {
  id: string;
  title: string;
  scenario: string;
  contextTime: string | null;
  contextLocation: string | null;
  contextCharacters: string | null;
  difficulty: "easy" | "medium" | "hard";
  source: "user" | "system" | "ai";
  status: "pending" | "approved" | "rejected" | "archived";
  reactionCount: number;
  sparkCount: number;
  collectionCount: number;
  authorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrainholeTag {
  id: string;
  brainholeId: string;
  tagId: string;
}

export interface BrainholeCollection {
  id: string;
  userId: string;
  brainholeId: string;
  createdAt: Date;
}

// 反应
export interface Reaction {
  id: string;
  content: string;
  identity: string;
  emotionTag: string | null;
  mediaUrl: string | null;
  mediaDuration: number | null;
  isSpark: boolean;
  sparkMarkedBy: string | null;
  sparkMarkedAt: Date | null;
  userId: string;
  brainholeId: string;
  roomId: string | null;
  createdAt: Date;
}

// 匹配
export interface MatchRequest {
  id: string;
  userId: string;
  brainholeId: string;
  identity: string;
  preferDifferent: boolean;
  status: "waiting" | "matched" | "cancelled" | "timeout";
  matchedUserId: string | null;
  roomId: string | null;
  createdAt: Date;
  expiresAt: Date;
  resolvedAt: Date | null;
}

// 房间
export interface Room {
  id: string;
  type: "duet" | "ensemble";
  brainholeId: string;
  status: "created" | "active" | "paused" | "finished" | "closed";
  directorId: string | null;
  maxRound: number | null;
  currentRound: number;
  scene: string | null;
  createdAt: Date;
  closedAt: Date | null;
}

export interface RoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  identity: string;
  roleCharacter: string | null;
  role: "actor" | "director" | "spectator";
  isOnline: boolean;
  joinedAt: Date;
  leftAt: Date | null;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  identity: string;
  roleCharacter: string | null;
  isSpark: boolean;
  sparkMarkedBy: string | null;
  sparkMarkedAt: Date | null;
  isAiPrompt: boolean;
  isDirectorNote: boolean;
  reactionId: string | null;
  createdAt: Date;
}

// 投票
export interface Vote {
  id: string;
  roomId: string;
  initiatorId: string;
  question: string;
  status: "open" | "closed" | "cancelled";
  winnerOptionIdx: number | null;
  createdAt: Date;
  closedAt: Date | null;
}

export interface VoteOption {
  id: string;
  voteId: string;
  idx: number;
  text: string;
}

export interface VoteCast {
  id: string;
  voteId: string;
  userId: string;
  optionId: string;
  createdAt: Date;
}

// 灵感库
export interface InspirationItem {
  id: string;
  roomId: string;
  content: string;
  sourceMessageId: string | null;
  voteId: string | null;
  addedBy: string;
  createdAt: Date;
}

// 故事草稿
export interface StoryDraft {
  id: string;
  userId: string;
  title: string;
  content: string;
  format: "script" | "narrative" | "dialogue";
  sourceRoomId: string | null;
  sparkIds: string | null;
  isAiGenerated: boolean;
  status: "draft" | "published" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

// 扩展类型（包含关联数据）
export interface BrainholeWithTags extends Brainhole {
  tags: Tag[];
  author?: User;
}

export interface RoomWithDetails extends Room {
  brainhole: Brainhole;
  participants: RoomParticipant[];
  messages: RoomMessage[];
}

export interface ReactionWithUser extends Reaction {
  user: User;
  brainhole: Brainhole;
}

export interface VoteWithDetails extends Vote {
  options: VoteOption[];
  casts: VoteCast[];
}