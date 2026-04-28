// 房间状态
export enum RoomStatus {
  CREATED = "created",
  ACTIVE = "active",
  PAUSED = "paused",
  FINISHED = "finished",
  CLOSED = "closed",
}

// 匹配状态
export enum MatchStatus {
  WAITING = "waiting",
  MATCHED = "matched",
  CANCELLED = "cancelled",
  TIMEOUT = "timeout",
}

// 脑洞难度
export enum BrainholeDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

// 脑洞来源
export enum BrainholeSource {
  USER = "user",
  SYSTEM = "system",
  AI = "ai",
}

// 脑洞状态
export enum BrainholeStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  ARCHIVED = "archived",
}

// 房间类型
export enum RoomType {
  DUET = "duet",
  ENSEMBLE = "ensemble",
}

// 参与者角色
export enum ParticipantRole {
  ACTOR = "actor",
  DIRECTOR = "director",
  SPECTATOR = "spectator",
}

// 投票状态
export enum VoteStatus {
  OPEN = "open",
  CLOSED = "closed",
  CANCELLED = "cancelled",
}

// 故事格式
export enum StoryFormat {
  SCRIPT = "script",
  NARRATIVE = "narrative",
  DIALOGUE = "dialogue",
}

// 故事状态
export enum StoryStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

// 情感标签
export enum EmotionTag {
  HAPPY = "happy",
  SAD = "sad",
  ANGRY = "angry",
  SURPRISED = "surprised",
  FEARFUL = "fearful",
  DISGUSTED = "disgusted",
  NEUTRAL = "neutral",
  EXCITED = "excited",
  CONFUSED = "confused",
  CURIOUS = "curious",
}

// 排序字段
export enum SortField {
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  REACTION_COUNT = "reactionCount",
  SPARK_COUNT = "sparkCount",
  COLLECTION_COUNT = "collectionCount",
  LEVEL = "level",
}

// 排序顺序
export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

// 用户等级
export enum UserLevel {
  NOVICE = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
  EXPERT = 4,
  MASTER = 5,
}

// 标签类别
export enum TagCategory {
  MEDICAL = "medical",
  LEGAL = "legal",
  EDUCATION = "education",
  SERVICE = "service",
  TECHNICAL = "technical",
  DAILY = "daily",
  ART = "art",
  BUSINESS = "business",
  SCIENCE = "science",
  OTHER = "other",
}

// 消息类型
export enum MessageType {
  USER = "user",
  AI_PROMPT = "ai_prompt",
  DIRECTOR_NOTE = "director_note",
  SYSTEM = "system",
}

// 匹配偏好
export enum MatchPreference {
  SAME_IDENTITY = "same_identity",
  DIFFERENT_IDENTITY = "different_identity",
  ANY = "any",
}

// 限流分类
export enum RateLimitCategory {
  AUTH = "auth",
  BRAINHOLE = "brainhole",
  MATCH = "match",
  ROOM = "room",
  AI = "ai",
}