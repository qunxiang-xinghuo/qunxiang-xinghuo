-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "sparkCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserIdentity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Brainhole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "contextTime" TEXT,
    "contextLocation" TEXT,
    "contextCharacters" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "source" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "sparkCount" INTEGER NOT NULL DEFAULT 0,
    "collectionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT,
    CONSTRAINT "Brainhole_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrainholeTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brainholeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "BrainholeTag_brainholeId_fkey" FOREIGN KEY ("brainholeId") REFERENCES "Brainhole" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BrainholeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrainholeCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brainholeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrainholeCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BrainholeCollection_brainholeId_fkey" FOREIGN KEY ("brainholeId") REFERENCES "Brainhole" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "emotionTag" TEXT,
    "mediaUrl" TEXT,
    "mediaDuration" REAL,
    "isSpark" BOOLEAN NOT NULL DEFAULT false,
    "sparkMarkedBy" TEXT,
    "sparkMarkedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "brainholeId" TEXT NOT NULL,
    "roomId" TEXT,
    CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reaction_brainholeId_fkey" FOREIGN KEY ("brainholeId") REFERENCES "Brainhole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reaction_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brainholeId" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "preferDifferent" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "matchedUserId" TEXT,
    "roomId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    CONSTRAINT "MatchRequest_brainholeId_fkey" FOREIGN KEY ("brainholeId") REFERENCES "Brainhole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'duet',
    "brainholeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "directorId" TEXT,
    "maxRound" INTEGER,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "scene" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "Room_brainholeId_fkey" FOREIGN KEY ("brainholeId") REFERENCES "Brainhole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "roleCharacter" TEXT,
    "role" TEXT NOT NULL DEFAULT 'actor',
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" DATETIME,
    CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "roleCharacter" TEXT,
    "isSpark" BOOLEAN NOT NULL DEFAULT false,
    "sparkMarkedBy" TEXT,
    "sparkMarkedAt" DATETIME,
    "isAiPrompt" BOOLEAN NOT NULL DEFAULT false,
    "isDirectorNote" BOOLEAN NOT NULL DEFAULT false,
    "reactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoomMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "winnerOptionIdx" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "Vote_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoteOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voteId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "VoteOption_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoteCast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoteCast_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VoteCast_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "VoteOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VoteCast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InspirationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceMessageId" TEXT,
    "voteId" TEXT,
    "addedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InspirationItem_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'script',
    "sourceRoomId" TEXT,
    "sparkIds" TEXT,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentity_userId_label_key" ON "UserIdentity"("userId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Brainhole_status_createdAt_idx" ON "Brainhole"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Brainhole_difficulty_idx" ON "Brainhole"("difficulty");

-- CreateIndex
CREATE INDEX "Brainhole_source_idx" ON "Brainhole"("source");

-- CreateIndex
CREATE UNIQUE INDEX "BrainholeTag_brainholeId_tagId_key" ON "BrainholeTag"("brainholeId", "tagId");

-- CreateIndex
CREATE INDEX "BrainholeCollection_userId_createdAt_idx" ON "BrainholeCollection"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BrainholeCollection_userId_brainholeId_key" ON "BrainholeCollection"("userId", "brainholeId");

-- CreateIndex
CREATE INDEX "Reaction_brainholeId_createdAt_idx" ON "Reaction"("brainholeId", "createdAt");

-- CreateIndex
CREATE INDEX "Reaction_roomId_createdAt_idx" ON "Reaction"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "Reaction_userId_idx" ON "Reaction"("userId");

-- CreateIndex
CREATE INDEX "Reaction_isSpark_idx" ON "Reaction"("isSpark");

-- CreateIndex
CREATE INDEX "MatchRequest_status_brainholeId_createdAt_idx" ON "MatchRequest"("status", "brainholeId", "createdAt");

-- CreateIndex
CREATE INDEX "MatchRequest_userId_status_idx" ON "MatchRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "Room_status_type_idx" ON "Room"("status", "type");

-- CreateIndex
CREATE INDEX "Room_brainholeId_idx" ON "Room"("brainholeId");

-- CreateIndex
CREATE INDEX "RoomParticipant_roomId_isOnline_idx" ON "RoomParticipant"("roomId", "isOnline");

-- CreateIndex
CREATE UNIQUE INDEX "RoomParticipant_roomId_userId_key" ON "RoomParticipant"("roomId", "userId");

-- CreateIndex
CREATE INDEX "RoomMessage_roomId_createdAt_idx" ON "RoomMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "RoomMessage_isSpark_idx" ON "RoomMessage"("isSpark");

-- CreateIndex
CREATE INDEX "Vote_roomId_status_idx" ON "Vote"("roomId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VoteOption_voteId_idx_key" ON "VoteOption"("voteId", "idx");

-- CreateIndex
CREATE UNIQUE INDEX "VoteCast_voteId_userId_key" ON "VoteCast"("voteId", "userId");

-- CreateIndex
CREATE INDEX "InspirationItem_roomId_idx" ON "InspirationItem"("roomId");

-- CreateIndex
CREATE INDEX "StoryDraft_userId_status_idx" ON "StoryDraft"("userId", "status");
