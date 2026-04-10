import { Module } from '@nestjs/common';
import { MarketplacePaymentsService } from './marketplace-payments.service';
import { MarketplacePaymentsController } from './marketplace-payments.controller';
import { MercadoPagoService } from './mercadopago.service';
import { ConsultationExpirationService } from './consultation-expiration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigModule } from '../platform-config/platform-config.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, PlatformConfigModule, ChatModule, NotificationsModule],
  controllers: [MarketplacePaymentsController],
  providers: [MarketplacePaymentsService, MercadoPagoService, ConsultationExpirationService, PrismaService],
  exports: [MarketplacePaymentsService, MercadoPagoService],
})
export class MarketplacePaymentsModule {}
