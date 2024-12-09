import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Helmet for security
  app.use(helmet.default());

  // Configure CORS to allow requests from your frontend
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:4201'],  // Allow requests from your Angular frontend
    credentials: true,                // Allow credentials (like cookies)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify allowed methods
    allowedHeaders: 'Content-Type, Authorization', // Specify allowed headers
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Listening on port ${process.env.PORT ?? 3000}`);
  
}
bootstrap();