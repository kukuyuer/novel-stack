import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许来自 Caddy (8080) 的图片或其他资源请求
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "minio" },
    ],
  },
  // 解决 "Cross origin request detected" 警告
  // 允许你的局域网 IP 访问开发服务器
  transpilePackages: ['lucide-react'], 
};

export default nextConfig;
