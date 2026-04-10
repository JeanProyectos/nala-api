import { config } from 'dotenv';
config(); // Cargar variables de entorno desde .env

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // ✅ Configurar WebSocket Adapter para Socket.IO
  app.useWebSocketAdapter(new IoAdapter(app));
  
  // Servir archivos estáticos desde la carpeta uploads
  // Usar process.cwd() para obtener el directorio raíz del proyecto
  // Esto funciona tanto en desarrollo como en producción
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });
  
  console.log('📁 Archivos estáticos servidos desde:', uploadsPath);

  // ✅ CORS mejorado para producción
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['https://nala-api.patasypelos.xyz', 'https://patasypelos.xyz'];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (móvil, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      // En desarrollo, permitir localhost
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      // En producción, validar origins
      if (allowedOrigins.some(allowed => origin.includes(allowed))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Manejo global de errores
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no están en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
      transform: true, // Transforma automáticamente los tipos
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // Escuchar en todas las interfaces de red
  
  console.log(`🚀 API NALA corriendo en http://localhost:${port}`);
  console.log(`📡 Accesible desde la red local`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS Origins permitidos: ${allowedOrigins.join(', ')}`);
  console.log(`🔌 WebSocket habilitado en namespace: /chat`);
}
bootstrap();
