import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class UploadService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName = 'novel-assets'; // 存储桶名称

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: 'minio',
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ROOT_USER || 'minio_admin',
      secretKey: process.env.MINIO_ROOT_PASSWORD || 'minio_pass_123',
    });
  }

  async onModuleInit() {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      
      // 🔥 关键：设置桶策略为“公开只读”
      // 这样浏览器才能直接通过 URL 访问图片
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
    // 处理文件名中文乱码问题，并加时间戳防重名
    // Buffer.from(file.originalname, 'latin1').toString('utf8') 是为了解决 Multer 在某些环境下的中文乱码
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const filename = `${Date.now()}-${originalName}`;
    
    await this.minioClient.putObject(
      this.bucketName,
      filename,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    // 🔥 关键修改：返回相对路径
    // 浏览器会自动将其解析为 http://你的IP:8080/novel-assets/xxx.jpg
    // Caddy 会拦截 /novel-assets/ 并转发给 MinIO
    return `/${this.bucketName}/${filename}`;
  }
}
