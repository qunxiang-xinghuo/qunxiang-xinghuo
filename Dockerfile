# =============================================================================
# 群像·星火 Dockerfile
# 多阶段构建：减小最终镜像体积
# =============================================================================

# -------- Stage 1: 依赖安装 --------
FROM node:20-alpine AS deps
WORKDIR /app

# 安装构建工具（better-sqlite3 需要编译原生模块）
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

# -------- Stage 2: 构建 --------
FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# -------- Stage 3: 运行 --------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 只复制必要的文件
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/server.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# 安装生产依赖（用于 server.ts 运行）
COPY --from=deps /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
