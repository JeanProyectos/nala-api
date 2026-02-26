import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';

@Injectable()
export class RemindersScheduler {
  private readonly logger = new Logger(RemindersScheduler.name);

  constructor(private remindersService: RemindersService) {}

  /**
   * Genera recordatorios automáticamente cada día a las 8:00 AM
   */
  @Cron('0 8 * * *', {
    name: 'generateReminders',
    timeZone: 'America/Bogota', // Ajusta según tu zona horaria
  })
  async handleGenerateReminders() {
    this.logger.log('⏰ Ejecutando tarea programada: Generar recordatorios');
    try {
      await this.remindersService.generateReminders();
    } catch (error) {
      this.logger.error('Error en tarea programada de generar recordatorios:', error);
    }
  }

  /**
   * Envía notificaciones push cada hora para recordatorios pendientes
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'sendReminders',
  })
  async handleSendReminders() {
    this.logger.log('⏰ Ejecutando tarea programada: Enviar recordatorios');
    try {
      await this.remindersService.sendPendingReminders();
    } catch (error) {
      this.logger.error('Error en tarea programada de enviar recordatorios:', error);
    }
  }
}
