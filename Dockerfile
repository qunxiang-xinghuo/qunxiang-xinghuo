# =============================================================================
# 群像·星火 Dockerfile
# 多阶段构建：生产镜像体积最小化，敏感信息不驻留镜像
# =============================================================================

# -------- Stage 1: 依赖安装 --------
FROM node:22-alpine AS deps
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# 安装构建工具（better-sqlite3 需要编译原生模块）
RUN apk add --no-cache python3 make g++

# 先复制依赖清单 + Prisma 相关文件（用于 npm ci 和后续生成 Prisma Client）
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# -------- Stage 2: 构建 --------
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# 编译时需要的 NEXT_PUBLIC_* 变量（浏览器可见，无敏感信息）
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# -------- Stage 3: 生产运行 --------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 先复制包清单
COPY package.json package-lock.json ./

# 安装生产依赖、临时构建工具、全局 CLI，然后清理并创建用户
RUN apk add --no-cache --virtual .build-deps python3 make g++ && \
    npm ci --omit=dev && \
    npm install -g tsx prisma && \
    apk del .build-deps && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/data && chown -R nextjs:nodejs /app

# 从 builder 复制构建产物和运行时必要文件
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/server.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./

USER nextjs

EXPOSE 3000

# 健康检查（需要应用实现 /api/health 端点，否则可注释掉）
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 仅启动应用（数据库迁移和种子应由独立任务管理）
CMD ["npm", "run", "start"]