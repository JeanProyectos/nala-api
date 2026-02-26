import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultationStatus } from '@prisma/client';

@Injectable()
export class ConsultationExpirationService {
  private readonly logger = new Logger(ConsultationExpirationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Expira consultas no pagadas después de 30 minutos
   * Se ejecuta cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireUnpaidConsultations() {
    this.logger.log('Ejecutando tarea de expiración de consultas no pagadas...');

    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    try {
      const expiredConsultations = await this.prisma.consultation.updateMany({
        where: {
          status: ConsultationStatus.PENDING_PAYMENT,
          createdAt: {
            lt: thirtyMinutesAgo,
          },
        },
        data: {
          status: ConsultationStatus.EXPIRED,
        },
      });

      if (expiredConsultations.count > 0) {
        this.logger.log(`Se expiraron ${expiredConsultations.count} consultas no pagadas`);
      }
    } catch (error) {
      this.logger.error(`Error expirando consultas: ${error.message}`);
    }
  }
}
