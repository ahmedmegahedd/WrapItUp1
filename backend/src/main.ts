import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3221',
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,  // local network (e.g. Expo on device)
      /^https?:\/\/localhost(:\d+)?$/,
    ],
    credentials: true,
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend server running on http://localhost:${port} (and on your network IP)`);
}

bootstrap();
