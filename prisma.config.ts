import { defineConfig } from "prisma/config";
import { fileURLToPath } from "url";
import path from "path";

// v8.2-fix: Prisma CLI 运行时的 cwd 可能是 prisma/ 目录，不能依赖 process.cwd()
// 使用 import.meta.url 获取 prisma.config.ts 所在目录（项目根目录），确保路径一致
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname);
const resolvedPath = path.join(projectRoot, "dev.db").replace(/\\/g, "/");
const resolvedUrl = `file:${resolvedPath}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: resolvedUrl,
  },
});
