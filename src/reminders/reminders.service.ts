import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReminderType, ReminderStatus } from '@prisma/client';
import { UpdateReminderDto } from './dto/update-reminder.dto';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Genera recordatorios automáticamente basados en vacunas y desparasitantes
   * Este método se ejecuta diariamente mediante cron job
   */
  async generateReminders() {
    this.logger.log('🔄 Iniciando generación de recordatorios...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Obtener todas las mascotas activas
      const pets = await this.prisma.pet.findMany({
        where: { deletedAt: null },
        include: {
          owner: {
            select: {
              id: true,
              expoPushToken: true,
            },
          },
          vaccines: {
            where: { nextDose: { not: null } },
            orderBy: { nextDose: 'asc' },
          },
          dewormings: {
            where: { nextDate: { not: null } },
            orderBy: { nextDate: 'asc' },
          },
          healthHistory: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      });

      let remindersCreated = 0;

      for (const pet of pets) {
        // ============ RECORDATORIOS DE VACUNAS ============
        for (const vaccine of pet.vaccines) {
          if (!vaccine.nextDose) continue;

          const nextDoseDate = new Date(vaccine.nextDose);
          nextDoseDate.setHours(0, 0, 0, 0);

          // Calcular días hasta la próxima dosis
          const daysUntil = Math.floor(
            (nextDoseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );

          // Notificar 7 días antes
          if (daysUntil === 7) {
            await this.createReminder(
              pet.ownerId,
              pet.id,
              ReminderType.VACCINE,
              `Vacuna próxima: ${vaccine.name}`,
              `A ${pet.name} le toca su vacuna ${vaccine.name} en 7 días`,
              nextDoseDate,
              vaccine.id,
            );
            remindersCreated++;
          }

          // Notificar 1 día antes
          if (daysUntil === 1) {
            await this.createReminder(
              pet.ownerId,
              pet.id,
              ReminderType.VACCINE,
              `Vacuna mañana: ${vaccine.name}`,
              `A ${pet.name} le toca su vacuna ${vaccine.name} mañana`,
              nextDoseDate,
              vaccine.id,
            );
            remindersCreated++;
          }

          // Notificar el mismo día
          if (daysUntil === 0) {
            await this.createReminder(
              pet.ownerId,
              pet.id,
              ReminderType.VACCINE,
              `Vacuna hoy: ${vaccine.name}`,
              `¡Hoy debes aplicar la vacuna ${vaccine.name} a ${pet.name}!`,
              nextDoseDate,
              vaccine.id,
            );
            remindersCreated++;
          }
        }

        // ============ RECORDATORIOS DE DESPARASITANTES ============
        for (const deworming of pet.dewormings) {
          if (!deworming.nextDate) continue;

          const nextDate = new Date(deworming.nextDate);
          nextDate.setHours(0, 0, 0, 0);

          const daysUntil = Math.floor(
            (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );

          // Notificar 3 días antes
          if (daysUntil === 3) {
            await this.createReminder(
              pet.ownerId,
              pet.id,
              ReminderType.DEWORMING,
              `Desparasitante próximo: ${deworming.product}`,
              `A ${pet.name} le toca desparasitante ${deworming.product} en 3 días`,
              nextDate,
              deworming.id,
            );
            remindersCreated++;
          }

          // Notificar el mismo día
          if (daysUntil === 0) {
            await this.createReminder(
              pet.ownerId,
              pet.id,
              ReminderType.DEWORMING,
              `Desparasitante hoy: ${deworming.product}`,
              `¡Hoy debes desparasitar a ${pet.name} con ${deworming.product}!`,
              nextDate,
              deworming.id,
            );
            remindersCreated++;
          }
        }

        // ============ RECORDATORIO DE REVISIÓN DE SALUD ============
        // Si no hay registros de salud en los últimos 90 días
        const lastHealthRecord = pet.healthHistory[0];
        if (!lastHealthRecord) {
          // Nunca ha tenido registros de salud
          const daysSinceCreation = Math.floor(
            (today.getTime() - new Date(pet.createdAt).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (daysSinceCreation >= 90) {
            await this.createReminder(
              pet.ownerId,
              pet.id,
              ReminderType.HEALTH_CHECK,
              'Revisión de salud pendiente',
              `Hace tiempo que no registras información de salud de ${pet.name}. Considera una revisión veterinaria.`,
              today,
              null,
            );
            remindersCreated++;
          }
        } else {
          const lastRecordDate = new Date(lastHealthRecord.date);
          lastRecordDate.setHours(0, 0, 0, 0);
          const daysSinceLastRecord = Math.floor(
            (today.getTime() - lastRecordDate.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (daysSinceLastRecord >= 90) {
            await this.createReminder(
              pet.ownerId,
              pet.id,
              ReminderType.HEALTH_CHECK,
              'Revisión de salud pendiente',
              `Hace ${daysSinceLastRecord} días que no registras información de salud de ${pet.name}. Considera una revisión veterinaria.`,
              today,
              null,
            );
            remindersCreated++;
          }
        }
      }

      this.logger.log(`✅ Se crearon ${remindersCreated} recordatorios`);
      return remindersCreated;
    } catch (error) {
      this.logger.error('Error generando recordatorios:', error);
      throw error;
    }
  }

  /**
   * Crea un recordatorio
   */
  private async createReminder(
    userId: number,
    petId: number,
    type: ReminderType,
    title: string,
    message: string,
    scheduledAt: Date,
    relatedId: number | null,
  ) {
    // Verificar si ya existe un recordatorio similar pendiente
    const existing = await this.prisma.reminder.findFirst({
      where: {
        userId,
        petId,
        type,
        scheduledAt,
        status: ReminderStatus.PENDING,
        relatedId: relatedId || undefined,
      },
    });

    if (existing) {
      this.logger.debug(`Recordatorio ya existe: ${title}`);
      return existing;
    }

    return this.prisma.reminder.create({
      data: {
        userId,
        petId,
        type,
        title,
        message,
        scheduledAt,
        relatedId,
        status: ReminderStatus.PENDING,
      },
    });
  }

  /**
   * Envía notificaciones push para recordatorios pendientes
   * Se ejecuta cada hora
   */
  async sendPendingReminders() {
    this.logger.log('📤 Enviando recordatorios pendientes...');
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    try {
      const reminders = await this.prisma.reminder.findMany({
        where: {
          status: ReminderStatus.PENDING,
          sent: false,
          scheduledAt: {
            lte: oneHourFromNow, // Recordatorios que deben enviarse en la próxima hora
            gte: now, // Pero aún no han pasado
          },
        },
        include: {
          user: {
            select: {
              id: true,
              expoPushToken: true,
            },
          },
          pet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      let sentCount = 0;

      for (const reminder of reminders) {
        if (!reminder.user.expoPushToken) {
          this.logger.debug(
            `Usuario ${reminder.user.id} no tiene expoPushToken registrado`,
          );
          continue;
        }

        const success = await this.notificationsService.sendPushNotification(
          reminder.user.expoPushToken,
          reminder.title,
          reminder.message,
          {
            reminderId: reminder.id,
            petId: reminder.petId,
            petName: reminder.pet.name,
            type: reminder.type,
          },
        );

        if (success) {
          await this.prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              sent: true,
              sentAt: new Date(),
            },
          });
          sentCount++;
        }
      }

      this.logger.log(`✅ Se enviaron ${sentCount} notificaciones push`);
      return sentCount;
    } catch (error) {
      this.logger.error('Error enviando recordatorios:', error);
      throw error;
    }
  }

  /**
   * Obtiene los recordatorios de un usuario
   */
  async findByUser(userId: number, status?: ReminderStatus) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.prisma.reminder.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * Actualiza un recordatorio
   */
  async update(id: number, userId: number, updateReminderDto: UpdateReminderDto) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!reminder) {
      throw new Error('Recordatorio no encontrado');
    }

    if (reminder.userId !== userId) {
      throw new Error('No tienes permisos para actualizar este recordatorio');
    }

    const updateData: any = { ...updateReminderDto };

    if (updateReminderDto.status === ReminderStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    if (updateReminderDto.postponedTo) {
      updateData.postponedTo = new Date(updateReminderDto.postponedTo);
      updateData.status = ReminderStatus.POSTPONED;
    }

    return this.prisma.reminder.update({
      where: { id },
      data: updateData,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    });
  }

  /**
   * Elimina un recordatorio
   */
  async remove(id: number, userId: number) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new Error('Recordatorio no encontrado');
    }

    if (reminder.userId !== userId) {
      throw new Error('No tienes permisos para eliminar este recordatorio');
    }

    return this.prisma.reminder.delete({
      where: { id },
    });
  }

  /**
   * Genera recordatorios de prueba (solo en desarrollo)
   */
  async generateTestReminders(userId: number) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Esta función solo está disponible en desarrollo');
    }

    this.logger.log('🧪 Generando recordatorios de prueba...');

    const pets = await this.prisma.pet.findMany({
      where: { ownerId: userId, deletedAt: null },
      take: 1,
    });

    if (pets.length === 0) {
      throw new Error('No tienes mascotas para generar recordatorios de prueba');
    }

    const pet = pets[0];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Crear recordatorios de prueba
    await this.createReminder(
      userId,
      pet.id,
      ReminderType.VACCINE,
      '🧪 Prueba: Vacuna próxima',
      `Recordatorio de prueba para ${pet.name}`,
      tomorrow,
      null,
    );

    await this.createReminder(
      userId,
      pet.id,
      ReminderType.DEWORMING,
      '🧪 Prueba: Desparasitante',
      `Recordatorio de desparasitante para ${pet.name}`,
      tomorrow,
      null,
    );

    this.logger.log('✅ Recordatorios de prueba creados');
    return { message: 'Recordatorios de prueba creados exitosamente' };
  }
}
