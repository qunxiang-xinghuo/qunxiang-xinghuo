import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';

type PrismaClientType = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

function createPrismaClient() {
  // Resolve database path relative to project root
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
  const absoluteDbPath = path.resolve(process.cwd(), dbPath);
  
  const adapter = new PrismaBetterSqlite3({
    url: `file:${absoluteDbPath}`,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
