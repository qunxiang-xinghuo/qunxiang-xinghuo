import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";
import { getErrorMessage, getErrorCode } from "@/lib/error-utils";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // v8.0-db-fix: 优先使用绝对路径，避免工作目录不一致导致找不到数据库
  const rawUrl = process.env.DATABASE_URL || "file:./dev.db";
  const resolvedUrl = rawUrl.startsWith("file:")
    ? rawUrl.replace(/^file:\.\//, `file:${process.cwd()}/`).replace(/^file:\.\\/, `file:${process.cwd()}\\`)
    : rawUrl;

  console.log(`[Prisma] DATABASE_URL raw: ${rawUrl}`);
  console.log(`[Prisma] DATABASE_URL resolved: ${resolvedUrl}`);

  // 检查数据库文件是否存在
  const dbPath = resolvedUrl.replace(/^file:/, "");
  if (!fs.existsSync(dbPath)) {
    console.error(`[Prisma] ERROR: Database file not found at ${dbPath}`);
    console.error(`[Prisma] cwd: ${process.cwd()}, NODE_ENV: ${process.env.NODE_ENV}`);
  } else {
    const stat = fs.statSync(dbPath);
    console.log(`[Prisma] Database file found: ${dbPath} (${(stat.size / 1024).toFixed(1)}KB)`);
  }

  try {
    const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });
    const client = new PrismaClient({ adapter });
    console.log("[Prisma] Client created successfully");
    return client;
  } catch (e: unknown) {
    console.error("[Prisma] Failed to create client:", getErrorMessage(e));
    throw e;
  }
}

// v8.0-fix: 始终使用全局单例，避免生产环境重复创建连接
export const db = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = db;
