// api/src/main.ts
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. 设置全局前缀 /api
  // 这样 @Controller('books') 就会自动变成 /api/books
  app.setGlobalPrefix('api');

  // 2. 允许跨域 (方便前端开发)
  app.enableCors();

  // 3. 监听 0.0.0.0 (必须显式指定，否则 Docker 外部访问不到)
  // 同时使用环境变量里的端口，或者默认 4000
  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();