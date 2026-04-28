import { db } from "@/lib/db";

export interface RoomCreateParams {
  brainholeId: string;
  type: "duet" | "ensemble";
  maxRound?: number;
  scene?: string;
  directorId?: string;
}

export interface RoomParticipantParams {
  roomId: string;
  userId: string;
  identity: string;
  role?: "actor" | "director" | "spectator";
  roleCharacter?: string;
}

export async function createRoom(params: RoomCreateParams) {
  const { brainholeId, type, maxRound, scene, directorId } = params;

  const room = await db.room.create({
    data: {
      brainholeId,
      type,
      status: "created",
      maxRound: maxRound || (type === "duet" ? 10 : 20),
      currentRound: 0,
      scene,
      directorId,
    },
  });

  return room;
}

export async function addParticipant(params: RoomParticipantParams) {
  const { roomId, userId, identity, role = "actor", roleCharacter } = params;

  // 检查房间是否存在且状态正常
  const room = await db.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    throw new Error("ROOM_NOT_FOUND");
  }

  if (room.status === "closed" || room.status === "finished") {
    throw new Error("ROOM_CLOSED");
  }

  // 检查是否已经是参与者
  const existingParticipant = await db.roomParticipant.findUnique({
    where: {
      roomId_userId: { roomId, userId },
    },
  });

  if (existingParticipant) {
    // 更新在线状态
    return db.roomParticipant.update({
      where: { id: existingParticipant.id },
      data: {
        isOnline: true,
        leftAt: null,
      },
    });
  }

  // 创建新参与者
  return db.roomParticipant.create({
    data: {
      roomId,
      userId,
      identity,
      role,
      roleCharacter,
      isOnline: true,
    },
  });
}

export async function markSpark(
  roomId: string,
  messageId: string,
  userId: string
) {
  // 检查消息是否存在
  const message = await db.roomMessage.findUnique({
    where: { id: messageId, roomId },
  });

  if (!message) {
    throw new Error("MESSAGE_NOT_FOUND");
  }

  // 检查是否已经标记为火花
  if (message.isSpark) {
    throw new Error("ALREADY_SPARKED");
  }

  // 检查用户是否有权限（必须是参与者）
  const participant = await db.roomParticipant.findFirst({
    where: {
      roomId,
      userId,
      isOnline: true,
    },
  });

  if (!participant) {
    throw new Error("NOT_PARTICIPANT");
  }

  // 更新消息为火花
  const updatedMessage = await db.roomMessage.update({
    where: { id: messageId },
    data: {
      isSpark: true,
      sparkMarkedBy: userId,
      sparkMarkedAt: new Date(),
    },
  });

  // 如果是反应类型的消息，也更新对应的反应
  if (message.reactionId) {
    await db.reaction.update({
      where: { id: message.reactionId },
      data: {
        isSpark: true,
        sparkMarkedBy: userId,
        sparkMarkedAt: new Date(),
      },
    });
  }

  // 更新用户的火花计数
  await db.user.update({
    where: { id: userId },
    data: {
      sparkCount: { increment: 1 },
    },
  });

  // 更新脑洞的火花计数
  // 首先需要获取房间的脑洞ID
  const room = await db.room.findUnique({
    where: { id: roomId },
    select: { brainholeId: true },
  });

  if (room) {
    await db.brainhole.update({
      where: { id: room.brainholeId },
      data: {
        sparkCount: { increment: 1 },
      },
    });
  }

  return updatedMessage;
}

export async function updateRoomStatus(
  roomId: string,
  status: "created" | "active" | "paused" | "finished" | "closed",
  directorId?: string
) {
  // 检查房间是否存在
  const room = await db.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    throw new Error("ROOM_NOT_FOUND");
  }

  // 检查权限（如果是导演操作）
  if (directorId && room.directorId !== directorId) {
    throw new Error("NOT_DIRECTOR");
  }

  const updateData: any = { status };
  if (status === "finished" || status === "closed") {
    updateData.closedAt = new Date();
  }

  return db.room.update({
    where: { id: roomId },
    data: updateData,
  });
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  content: string,
  identity: string,
  options?: {
    roleCharacter?: string;
    isAiPrompt?: boolean;
    isDirectorNote?: boolean;
    reactionId?: string;
  }
) {
  const { roleCharacter, isAiPrompt, isDirectorNote, reactionId } = options || {};

  // 检查发送者是否是房间参与者
  const participant = await db.roomParticipant.findFirst({
    where: {
      roomId,
      userId: senderId,
      isOnline: true,
    },
  });

  if (!participant) {
    throw new Error("NOT_PARTICIPANT");
  }

  // 检查房间状态
  const room = await db.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    throw new Error("ROOM_NOT_FOUND");
  }

  if (room.status === "paused" && !isDirectorNote) {
    throw new Error("ROOM_PAUSED");
  }

  if (room.status === "finished" || room.status === "closed") {
    throw new Error("ROOM_CLOSED");
  }

  // 创建消息
  const message = await db.roomMessage.create({
    data: {
      roomId,
      senderId,
      content,
      identity,
      roleCharacter,
      isAiPrompt: isAiPrompt || false,
      isDirectorNote: isDirectorNote || false,
      reactionId,
    },
  });

  // 如果是双人模式且不是AI提示/导演备注，增加回合计数
  if (room.type === "duet" && !isAiPrompt && !isDirectorNote) {
    await db.room.update({
      where: { id: roomId },
      data: {
        currentRound: { increment: 1 },
      },
    });
  }

  return message;
}

export async function getRoomWithParticipants(roomId: string) {
  return db.room.findUnique({
    where: { id: roomId },
    include: {
      brainhole: true,
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              level: true,
              sparkCount: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
      },
    },
  });
}