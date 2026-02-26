import { Module } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VeterinariansModule } from '../veterinarians/veterinarians.module';
import { MarketplacePaymentsModule } from '../marketplace-payments/marketplace-payments.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [PrismaModule, VeterinariansModule, MarketplacePaymentsModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, PrismaService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
