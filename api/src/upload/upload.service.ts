import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class UploadService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName = 'novel-assets'; // 存储桶名称

  constructor() {
    // 连接到 Docker 网络内部的 minio 容器
    this.minioClient = new Minio.Client({
      endPoint: 'minio', // docker-compose 服务名
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ROOT_USER || 'minio_admin',
      secretKey: process.env.MINIO_ROOT_PASSWORD || 'minio_pass_123',
    });
  }

  async onModuleInit() {
    // 初始化时检查桶是否存在，不存在则创建
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      // 设置桶策略为公开只读 (方便前端直接访问图片)
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };
      await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
    }
  }

  async uploadFile(file: Express.Multer.File) {
    // 生成唯一文件名
    const filename = `${Date.now()}-${file.originalname}`;
    
    await this.minioClient.putObject(
      this.bucketName,
      filename,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    // 返回可访问的 URL
    // 注意：这里返回的是前端浏览器能访问的地址
    // 如果是在本地开发，应该是 localhost:9000/novel-assets/xxx
    // 但我们在 Docker 里，Caddy 没有代理 9000，所以我们需要用 Caddy 暴露 MinIO
    // 或者简单点，我们先返回一个相对路径，或者配置 Caddy 代理 /uploads
    
    // 简单起见，我们假设 minio 映射到了 localhost:9000
    return `http://localhost:9000/${this.bucketName}/${filename}`;
  }
}