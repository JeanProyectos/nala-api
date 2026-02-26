import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PetsModule } from './pets/pets.module';
import { VaccinesModule } from './vaccines/vaccines.module';
import { DewormingsModule } from './dewormings/dewormings.module';
import { AllergiesModule } from './allergies/allergies.module';
import { HealthHistoryModule } from './health-history/health-history.module';
import { UploadModule } from './upload/upload.module';
import { RemindersModule } from './reminders/reminders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { VeterinariansModule } from './veterinarians/veterinarians.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { MessagesModule } from './messages/messages.module';
import { ChatModule } from './chat/chat.module';
import { MarketplacePaymentsModule } from './marketplace-payments/marketplace-payments.module';
import { PlatformConfigModule } from './platform-config/platform-config.module';
import { CommunityModule } from './community/community.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    PetsModule,
    VaccinesModule,
    DewormingsModule,
    AllergiesModule,
    HealthHistoryModule,
    UploadModule,
    NotificationsModule,
    RemindersModule,
    VeterinariansModule,
    ConsultationsModule,
    MessagesModule,
    ChatModule,
    MarketplacePaymentsModule,
    PlatformConfigModule,
    CommunityModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
