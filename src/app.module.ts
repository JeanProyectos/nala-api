import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PetsModule } from './pets/pets.module';
import { VaccinesModule } from './vaccines/vaccines.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, PetsModule, VaccinesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
