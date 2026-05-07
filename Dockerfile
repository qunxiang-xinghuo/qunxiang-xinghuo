# =============================================================================
# 群像·星火 Dockerfile
# 多阶段构建：减小最终镜像体积
# =============================================================================

# -------- Stage 1: 依赖安装 --------
FROM node:22-alpine AS deps
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# 安装构建工具（better-sqlite3 需要编译原生模块）
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# -------- Stage 2: 构建 --------
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXTAUTH_SECRET=your-nextauth-secret-key-here-change-in-production
ARG NEXTAUTH_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
ARG DEEPSEEK_API_KEY=
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# -------- Stage 3: 运行 --------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

# 自定义 server.ts 需要 .next 构建结果、源码和运行时依赖
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/server.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["sh", "-c", "echo '[Entry] Running prisma db push...' && npx prisma db push --accept-data-loss && echo '[Entry] Seeding...' && npx tsx prisma/seed.ts || true && echo '[Entry] Starting...' && npm run start"]
