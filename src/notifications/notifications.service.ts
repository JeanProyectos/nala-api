import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

/** Canal Android — debe coincidir con el que crea la app (expo-notifications) */
export const EXPO_ANDROID_CHANNEL_ID = 'nala-alerts';

type PushDeviceDelegate = {
  findMany?: (args: { where: { userId: number }; select: { token: true } }) => Promise<{ token: string }[]>;
  deleteMany?: (args: { where: { token: string } }) => Promise<unknown>;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo: Expo;

  constructor(private prisma: PrismaService) {
    this.expo = new Expo();
  }

  /** Si el cliente Prisma no se regeneró tras añadir PushDevice, el delegate no existe (evita crash en prod). */
  private pushDeviceTable(): PushDeviceDelegate | undefined {
    return (this.prisma as unknown as { pushDevice?: PushDeviceDelegate }).pushDevice;
  }

  private baseMessage(
    to: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): ExpoPushMessage {
    return {
      to,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
      channelId: EXPO_ANDROID_CHANNEL_ID,
    };
  }

  async removeInvalidPushToken(token: string): Promise<void> {
    const pd = this.pushDeviceTable();
    if (pd?.deleteMany) {
      await pd.deleteMany({ where: { token } }).catch(() => undefined);
    }
    await this.prisma.user
      .updateMany({
        where: { expoPushToken: token },
        data: { expoPushToken: null },
      })
      .catch(() => undefined);
  }

  /**
   * Envía a un token concreto (bajo nivel).
   */
  async sendPushNotification(
    expoPushToken: string,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<boolean> {
    if (!expoPushToken) {
      this.logger.warn('No se proporcionó expoPushToken');
      return false;
    }

    if (!Expo.isExpoPushToken(expoPushToken)) {
      this.logger.warn(`Token inválido: ${expoPushToken}`);
      return false;
    }

    try {
      const messages: ExpoPushMessage[] = [this.baseMessage(expoPushToken, title, message, data)];
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

      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          this.logger.error(`Error en ticket: ${ticket.message}`);
          if (ticket.details?.error === 'DeviceNotRegistered') {
            await this.removeInvalidPushToken(expoPushToken);
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
   * Recopila todos los tokens Expo del usuario (tabla PushDevice + legado expoPushToken) y envía a cada uno.
   */
  async sendPushToUser(
    userId: number,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<number> {
    const pd = this.pushDeviceTable();
    const devices =
      pd && typeof pd.findMany === 'function'
        ? await pd.findMany({
            where: { userId },
            select: { token: true },
          })
        : [];

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true },
    });

    const tokenSet = new Set<string>();
    for (const d of devices) {
      if (d.token) tokenSet.add(d.token);
    }
    if (user?.expoPushToken) tokenSet.add(user.expoPushToken);

    const tokens = [...tokenSet].filter((t) => Expo.isExpoPushToken(t));
    if (tokens.length === 0) {
      return 0;
    }

    const messages: ExpoPushMessage[] = tokens.map((to) => this.baseMessage(to, title, message, data));
    let success = 0;

    try {
      const chunks = this.expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          const token = chunk[i]?.to as string;
          if (ticket.status === 'ok') {
            success++;
          } else if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered' && token) {
            await this.removeInvalidPushToken(token);
          }
        }
      }
    } catch (e) {
      this.logger.error('sendPushToUser chunk error:', e);
    }

    return success;
  }

  async sendBulkPushNotifications(
    tokens: string[],
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<number> {
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) {
      return 0;
    }

    let successCount = 0;
    for (const token of validTokens) {
      const ok = await this.sendPushNotification(token, title, message, data);
      if (ok) successCount++;
    }

    return successCount;
  }
}
