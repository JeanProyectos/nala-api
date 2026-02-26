import { Module } from '@nestjs/common';
import { DewormingsService } from './dewormings.service';
import { DewormingsController } from './dewormings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DewormingsController],
  providers: [DewormingsService],
})
export class DewormingsModule {}
