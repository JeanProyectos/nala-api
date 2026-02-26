import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VetOnlyGuard } from './guards/vet-only.guard';

@Module({
  imports: [PrismaModule],
  controllers: [CommunityController],
  providers: [CommunityService, VetOnlyGuard],
  exports: [CommunityService],
})
export class CommunityModule {}
