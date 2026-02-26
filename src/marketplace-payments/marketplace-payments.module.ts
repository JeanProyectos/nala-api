import { Module } from '@nestjs/common';
import { MarketplacePaymentsService } from './marketplace-payments.service';
import { MarketplacePaymentsController } from './marketplace-payments.controller';
import { WompiService } from './wompi.service';
import { ConsultationExpirationService } from './consultation-expiration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigModule } from '../platform-config/platform-config.module';

@Module({
  imports: [PrismaModule, PlatformConfigModule],
  controllers: [MarketplacePaymentsController],
  providers: [MarketplacePaymentsService, WompiService, ConsultationExpirationService, PrismaService],
  exports: [MarketplacePaymentsService, WompiService],
})
export class MarketplacePaymentsModule {}
