import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  isVet?: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private consultationRooms = new Map<number, Set<string>>(); // consultationId -> Set of socketIds

  constructor(
    private messagesService: MessagesService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Autenticar usando el token JWT
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Cliente ${client.id} desconectado: sin token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.userId;

      // Verificar si es veterinario
      const vet = await this.prisma.veterinarian.findUnique({
        where: { userId: payload.userId },
      });
      client.isVet = !!vet;

      this.logger.log(`Cliente conectado: ${client.id} (Usuario: ${client.userId})`);
    } catch (error) {
      this.logger.error(`Error autenticando cliente ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    
    // Remover de todas las salas
    this.consultationRooms.forEach((sockets, consultationId) => {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.consultationRooms.delete(consultationId);
        }
      }
    });
  }

  /**
   * Unirse a una sala de consulta
   */
  @SubscribeMessage('join_consultation')
  async handleJoinConsultation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number },
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'No autenticado' });
        return;
      }

      const consultation = await this.prisma.consultation.findUnique({
        where: { id: data.consultationId },
        include: { payment: true },
      });

      if (!consultation) {
        client.emit('error', { message: 'Consulta no encontrada' });
        return;
      }

      // Verificar permisos
      let hasAccess = false;
      if (consultation.userId === client.userId) {
        hasAccess = true;
      } else if (client.isVet) {
        const vet = await this.prisma.veterinarian.findUnique({
          where: { userId: client.userId },
        });
        if (vet && vet.id === consultation.veterinarianId) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        client.emit('error', { message: 'No tienes permisos para esta consulta' });
        return;
      }

      // Permitir consultas en PENDING_PAYMENT, IN_PROGRESS o PAID (pago después)
      if (consultation.status !== 'PENDING_PAYMENT' && consultation.status !== 'IN_PROGRESS' && consultation.status !== 'PAID') {
        client.emit('error', { 
          message: 'La consulta no está disponible',
          consultationId: consultation.id,
        });
        return;
      }

      // Unirse a la sala
      const room = `consultation_${data.consultationId}`;
      client.join(room);

      // Registrar en el mapa
      if (!this.consultationRooms.has(data.consultationId)) {
        this.consultationRooms.set(data.consultationId, new Set());
      }
      this.consultationRooms.get(data.consultationId)!.add(client.id);

      this.logger.log(`Usuario ${client.userId} se unió a consulta ${data.consultationId}`);

      // Enviar historial de mensajes
      const messages = await this.messagesService.findByConsultation(
        data.consultationId,
        client.userId,
      );
      client.emit('message_history', messages);

      // Notificar a otros en la sala
      client.to(room).emit('user_joined', {
        userId: client.userId,
        consultationId: data.consultationId,
      });
    } catch (error) {
      this.logger.error('Error en join_consultation:', error);
      client.emit('error', { message: 'Error al unirse a la consulta' });
    }
  }

  /**
   * Enviar mensaje
   */
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number; content: string },
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'No autenticado' });
        return;
      }

      // Verificar que la consulta esté pagada
      const consultation = await this.prisma.consultation.findUnique({
        where: { id: data.consultationId },
      });

      if (!consultation) {
        client.emit('error', { message: 'Consulta no encontrada' });
        return;
      }

      // Permitir mensajes en consultas activas (pago después)
      if (consultation.status !== 'PENDING_PAYMENT' && consultation.status !== 'IN_PROGRESS' && consultation.status !== 'PAID') {
        client.emit('error', { 
          message: 'La consulta no está disponible',
        });
        return;
      }

      const senderType = client.isVet ? 'vet' : 'user';

      // Guardar mensaje en BD
      const message = await this.messagesService.create(
        data.consultationId,
        senderType,
        data.content,
        client.userId,
      );

      // Emitir a todos en la sala
      const room = `consultation_${data.consultationId}`;
      this.server.to(room).emit('new_message', {
        id: message.id,
        consultationId: message.consultationId,
        senderType: message.senderType,
        content: message.content,
        createdAt: message.createdAt,
      });

      this.logger.log(`Mensaje enviado en consulta ${data.consultationId} por usuario ${client.userId}`);
    } catch (error) {
      this.logger.error('Error en send_message:', error);
      client.emit('error', { message: error.message || 'Error al enviar mensaje' });
    }
  }

  /**
   * Indicador de "escribiendo..."
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number; isTyping: boolean },
  ) {
    if (!client.userId) return;

    const room = `consultation_${data.consultationId}`;
    client.to(room).emit('user_typing', {
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }

  /**
   * Salir de una consulta
   */
  @SubscribeMessage('leave_consultation')
  async handleLeaveConsultation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number },
  ) {
    const room = `consultation_${data.consultationId}`;
    client.leave(room);

    if (this.consultationRooms.has(data.consultationId)) {
      this.consultationRooms.get(data.consultationId)!.delete(client.id);
    }

    client.to(room).emit('user_left', {
      userId: client.userId,
      consultationId: data.consultationId,
    });
  }
}
