import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformConfigModule } from '../platform-config/platform-config.module';
import {
  AdminSettlementsController,
  VeterinarianSettlementsController,
  VeterinarianSettlementsVetController,
} from './veterinarian-settlements.controller';
import { VeterinarianSettlementsService } from './veterinarian-settlements.service';

@Module({
  imports: [PrismaModule, PlatformConfigModule],
  controllers: [
    VeterinarianSettlementsController,
    VeterinarianSettlementsVetController,
    AdminSettlementsController,
  ],
  providers: [VeterinarianSettlementsService],
  exports: [VeterinarianSettlementsService],
})
export class VeterinarianSettlementsModule {}
