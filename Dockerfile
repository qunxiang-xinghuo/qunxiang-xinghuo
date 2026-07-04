# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN pnpm build

# 运行阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置环境变量
ENV NODE_ENV=production
ENV DEPLOY_RUN_PORT=5000

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/.coze ./.coze

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["node", "dist/server.js"]
