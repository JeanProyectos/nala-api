import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para la app móvil
  app.enableCors({
    origin: true, // Permite todas las origenes (en producción especifica las IPs)
    credentials: true,
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

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Escuchar en todas las interfaces de red
  console.log(`🚀 API NALA corriendo en http://localhost:${port}`);
  console.log(`📡 Accesible desde la red local`);
}
bootstrap();
