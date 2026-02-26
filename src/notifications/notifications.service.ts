import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo: Expo;

  constructor(private prisma: PrismaService) {
    this.expo = new Expo();
  }

  /**
   * Envía una notificación push a un usuario
   */
  async sendPushNotification(
    expoPushToken: string,
    title: string,
    message: string,
    data?: any,
  ): Promise<boolean> {
    if (!expoPushToken) {
      this.logger.warn('No se proporcionó expoPushToken');
      return false;
    }

    // Verificar que el token sea válido
    if (!Expo.isExpoPushToken(expoPushToken)) {
      this.logger.warn(`Token inválido: ${expoPushToken}`);
      return false;
    }

    try {
      const messages: ExpoPushMessage[] = [
        {
          to: expoPushToken,
          sound: 'default',
          title,
          body: message,
          data: data || {},
          priority: 'high',
          channelId: 'default',
        },
      ];

      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          this.logger.error('Error enviando notificación:', error);
        }
      }

      // Verificar si hay errores en los tickets
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          this.logger.error(`Error en ticket: ${ticket.message}`);
          if (ticket.details?.error === 'DeviceNotRegistered') {
            // El token ya no es válido, eliminarlo de la BD
            const user = await this.prisma.user.findFirst({
              where: { expoPushToken },
            });
            if (user) {
              await this.prisma.user.update({
                where: { id: user.id },
                data: { expoPushToken: null },
              });
            }
          }
          return false;
        }
      }

      this.logger.log(`Notificación enviada exitosamente a ${expoPushToken}`);
      return true;
    } catch (error) {
      this.logger.error('Error enviando notificación push:', error);
      return false;
    }
  }

  /**
   * Envía notificaciones a múltiples usuarios
   */
  async sendBulkPushNotifications(
    tokens: string[],
    title: string,
    message: string,
    data?: any,
  ): Promise<number> {
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) {
      return 0;
    }

    let successCount = 0;
    for (const token of validTokens) {
      const success = await this.sendPushNotification(token, title, message, data);
      if (success) successCount++;
    }

    return successCount;
  }
}
