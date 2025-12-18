# web/Dockerfile

# 1. 构建阶段
FROM node:20 AS builder
WORKDIR /app

# 安装依赖
COPY package*.json ./
# 必须显式安装排版插件，防止构建失败
RUN npm install && npm install -D @tailwindcss/typography

# 复制源代码
COPY . .

# 禁用 Next.js 的遥测数据
ENV NEXT_TELEMETRY_DISABLED 1

# 构建 Next.js 应用
RUN npm run build

# 2. 运行阶段
FROM node:20
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# 启动 Next.js 生产模式
CMD ["npm", "start"]