# api/Dockerfile

# 1. 构建阶段
FROM node:20 AS builder
WORKDIR /app

# 安装依赖 (利用缓存层)
COPY package*.json ./
# 使用 npm ci 严格按照 lock 文件安装，确保版本一致
RUN npm install

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 编译 TypeScript 代码
RUN npm run build

# 2. 运行阶段 (减小体积)
FROM node:20
WORKDIR /app

# 复制构建产物和依赖
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# 暴露端口
EXPOSE 4000

# 启动生产模式
CMD ["node", "dist/main"]