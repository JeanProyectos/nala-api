import { Module } from '@nestjs/common';
import { HealthHistoryService } from './health-history.service';
import { HealthHistoryController } from './health-history.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthHistoryController],
  providers: [HealthHistoryService],
})
export class HealthHistoryModule {}
