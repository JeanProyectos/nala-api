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
import { HttpException, Logger, UseGuards } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { DiagnosticsService } from '../diagnostics/diagnostics.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  isVet?: boolean;
}

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
        return;
      }

      const allowedOrigins = ['https://nala-api.patasypelos.xyz', 'https://patasypelos.xyz'];
      if (allowedOrigins.some((allowed) => origin.includes(allowed))) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by WebSocket CORS'));
    },
    credentials: true,
  },
  namespace: '/chat',
  // ✅ Configuración crítica para producción
  transports: ['websocket', 'polling'], // Permitir ambos para compatibilidad
  allowEIO3: true, // Compatibilidad con clientes antiguos
  pingTimeout: 60000, // 60 segundos (Cloudflare requiere > 30s)
  pingInterval: 25000, // Ping cada 25 segundos
  // ✅ Importante para Cloudflare Tunnel
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8, // 100MB para archivos grandes
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private consultationRooms = new Map<number, Set<string>>(); // consultationId -> Set of socketIds
  private userSockets = new Map<number, Set<string>>(); // userId -> Set of socketIds (para múltiples dispositivos)
  private callReadyParticipants = new Map<number, Set<number>>(); // consultationId -> Set of userIds listos para WebRTC
  // Evitar emitir request_offer en bucle por cada consulta
  private requestOfferEmittedForConsultation = new Set<number>();

  constructor(
    private messagesService: MessagesService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private diagnosticsService: DiagnosticsService,
  ) {
    // ✅ Limpiar rooms huérfanos periódicamente
    setInterval(() => {
      this.cleanupOrphanRooms();
    }, 300000); // Cada 5 minutos
  }

  private appendServerCallLog(
    consultationId: number | undefined,
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    message: string,
    payload?: unknown,
  ) {
    void this.diagnosticsService
      .logVideoCallEvent(consultationId, level, message, payload)
      .catch((err) => this.logger.warn(`Videocall log omitido: ${String((err as Error)?.message || err)}`));
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Autenticar usando el token JWT
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Cliente ${client.id} desconectado: sin token`);
        client.disconnect();
        return;
      }

      let payload;
      try {
        payload = this.jwtService.verify(token);
      } catch (error) {
        this.logger.warn(`Token inválido para cliente ${client.id}:`, error.message);
        client.emit('error', { message: 'Token inválido' });
        client.disconnect();
        return;
      }

      // Compatibilidad con tokens antiguos/nuevos:
      // AuthService firma con "sub", pero también aceptamos "userId"/"id".
      const rawUserId = payload?.userId ?? payload?.sub ?? payload?.id;
      const parsedUserId = Number(rawUserId);

      if (!rawUserId || Number.isNaN(parsedUserId)) {
        this.logger.warn(`Token sin userId válido para cliente ${client.id}`);
        client.emit('error', { message: 'Token inválido: usuario no identificado' });
        client.disconnect();
        return;
      }

      client.userId = parsedUserId;

      // Verificar si es veterinario
      const vet = await this.prisma.veterinarian.findUnique({
        where: { userId: client.userId },
      });
      client.isVet = !!vet;

      // ✅ Registrar socket del usuario (soporta múltiples dispositivos)
      if (client.userId) {
        if (!this.userSockets.has(client.userId)) {
          this.userSockets.set(client.userId, new Set());
        }
        this.userSockets.get(client.userId)!.add(client.id);
      }

      this.logger.log(`✅ Cliente conectado: ${client.id} (Usuario: ${client.userId}, Vet: ${client.isVet})`);
      this.appendServerCallLog(undefined, 'INFO', 'socket_connected', {
        socketId: client.id,
        userId: client.userId,
        isVet: client.isVet,
      });
      
      // ✅ Enviar confirmación de conexión
      client.emit('connected', { 
        userId: client.userId,
        socketId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error autenticando cliente ${client.id}:`, error);
      this.appendServerCallLog(undefined, 'ERROR', 'socket_auth_error', { socketId: client.id, error: String(error?.message || error) });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`⚠️ Cliente desconectado: ${client.id} (Usuario: ${client.userId})`);
    this.appendServerCallLog(undefined, 'INFO', 'socket_disconnected', { socketId: client.id, userId: client.userId });
    
    // ✅ Limpiar de rooms
    this.consultationRooms.forEach((sockets, consultationId) => {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.consultationRooms.delete(consultationId);
        }
      }
    });

    // ✅ Limpiar de userSockets
    if (client.userId && this.userSockets.has(client.userId)) {
      this.userSockets.get(client.userId)!.delete(client.id);
      if (this.userSockets.get(client.userId)!.size === 0) {
        this.userSockets.delete(client.userId);
      }
    }

    if (client.userId) {
      this.callReadyParticipants.forEach((participants, consultationId) => {
        participants.delete(client.userId!);
        if (participants.size === 0) {
          this.callReadyParticipants.delete(consultationId);
        }
      });
    }
  }

  /**
   * ✅ Limpiar rooms huérfanos (prevenir memory leaks)
   */
  private cleanupOrphanRooms() {
    // En una implementación completa, verificarías en BD qué consultas están activas
    // Por ahora, solo limpiamos rooms vacíos
    this.consultationRooms.forEach((sockets, consultationId) => {
      if (sockets.size === 0) {
        this.consultationRooms.delete(consultationId);
        this.logger.debug(`🧹 Room ${consultationId} limpiado (vacío)`);
      }
    });
  }

  private markUserCallReady(consultationId: number, userId: number) {
    if (!this.callReadyParticipants.has(consultationId)) {
      this.callReadyParticipants.set(consultationId, new Set());
    }

    const participants = this.callReadyParticipants.get(consultationId)!;
    participants.add(userId);
    return participants;
  }

  private clearCallReadyState(consultationId: number, userId?: number) {
    if (!this.callReadyParticipants.has(consultationId)) {
      return;
    }

    if (typeof userId === 'number') {
      const participants = this.callReadyParticipants.get(consultationId)!;
      participants.delete(userId);
      if (participants.size === 0) {
        this.callReadyParticipants.delete(consultationId);
      }
      return;
    }

    this.callReadyParticipants.delete(consultationId);
  }

  private getRoomSocketIds(consultationId: number): string[] {
    return Array.from(this.consultationRooms.get(consultationId) || []);
  }

  /**
   * Resuelve el socket por id. En Socket.IO v4, en un namespace (p. ej. /chat)
   * `server.sockets` es el Map<id, Socket>. En el servidor raíz, el Map está en
   * `server.sockets.sockets`. El código antiguo asumía siempre la segunda forma y fallaba al unirse a la consulta.
   */
  private getSocketById(socketId: string): AuthenticatedSocket | undefined {
    const root = this.server as unknown as {
      sockets: Map<string, AuthenticatedSocket> | { sockets: Map<string, AuthenticatedSocket> };
    };
    const first = root?.sockets;
    if (first instanceof Map) {
      return first.get(socketId);
    }
    const nested = (first as { sockets?: Map<string, AuthenticatedSocket> } | undefined)?.sockets;
    return nested?.get(socketId);
  }

  private getRoomUserIds(consultationId: number): number[] {
    const socketIds = this.getRoomSocketIds(consultationId);
    const userIds = new Set<number>();
    socketIds.forEach((socketId) => {
      const socket = this.getSocketById(socketId);
      if (socket?.userId) {
        userIds.add(socket.userId);
      }
    });
    return Array.from(userIds);
  }

  private resetConsultationCallState(consultationId: number, reason: string) {
    this.clearCallReadyState(consultationId);
    this.requestOfferEmittedForConsultation.delete(consultationId);

    const roomState = {
      consultationId,
      reason,
      roomSocketIds: this.getRoomSocketIds(consultationId),
      roomUserIds: this.getRoomUserIds(consultationId),
      readyUsers: Array.from(this.callReadyParticipants.get(consultationId) || []),
      requestOfferAlreadyEmitted: this.requestOfferEmittedForConsultation.has(consultationId),
      inCall: false,
    };

    this.logger.log(`🔄 Call state reset for consultation ${consultationId}: ${JSON.stringify(roomState)}`);
    this.appendServerCallLog(consultationId, 'INFO', 'call_state_reset', roomState);
  }

  private async getConsultationRealtimeState(consultationId: number) {
    return this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { payment: true },
    });
  }

  private isClientPaymentLocked(
    consultation: { userId: number; status: string; startDate: Date | null; payment?: { status: string } | null },
    client: AuthenticatedSocket,
  ) {
    if (!client.userId || consultation.userId !== client.userId) {
      return false;
    }

    if (consultation.status !== 'IN_PROGRESS' || !consultation.startDate) {
      return false;
    }

    const hasApprovedPayment = consultation.payment?.status === 'APPROVED';
    const elapsedMs = Date.now() - new Date(consultation.startDate).getTime();

    return elapsedMs >= 2 * 60 * 1000 && !hasApprovedPayment;
  }

  private emitPaymentRequired(client: AuthenticatedSocket, consultationId: number) {
    client.emit('payment_required', {
      consultationId,
      message: 'Debes pagar la consulta para continuar.',
    });
  }

  /**
   * Normaliza consultationId desde el body del socket (objeto, string numérico, array tipo Expo Router).
   */
  private parseIncomingConsultationId(payload: unknown): number | null {
    if (payload == null) {
      return null;
    }
    let obj: Record<string, unknown> | null = null;
    if (Array.isArray(payload) && payload.length > 0) {
      const first = payload[0];
      if (first && typeof first === 'object') {
        obj = first as Record<string, unknown>;
      }
    } else if (typeof payload === 'object') {
      obj = payload as Record<string, unknown>;
    }
    if (!obj) {
      return null;
    }
    let raw: unknown = obj['consultationId'] ?? obj['consultation_id'];
    if (Array.isArray(raw)) {
      raw = raw[0];
    }
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }
    const n = parseInt(String(raw).trim(), 10);
    if (!Number.isFinite(n) || n < 1) {
      return null;
    }
    return n;
  }

  /** Mismos estados que permiten estar en la sala y usar señalización de llamada (alineado con join_consultation). */
  private consultationAllowsCalls(status: string): boolean {
    return status === 'PENDING_APPROVAL' || status === 'IN_PROGRESS' || status === 'PAID';
  }

  /**
   * ✅ Agregar método de heartbeat para detectar conexiones muertas
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: Date.now() });
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
        return { error: 'No autenticado' };
      }

      const consultationId = this.parseIncomingConsultationId(data);
      if (consultationId == null) {
        client.emit('error', { message: 'consultationId inválido' });
        return { error: 'consultationId inválido' };
      }

      const consultation = await this.prisma.consultation.findUnique({
        where: { id: consultationId },
        include: { payment: true },
      });

      if (!consultation) {
        client.emit('error', { message: 'Consulta no encontrada' });
        return { error: 'Consulta no encontrada' };
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
        return { error: 'No tienes permisos para esta consulta' };
      }

      // Permitir consultas en PENDING_PAYMENT, IN_PROGRESS o PAID (pago después)
      if (
        consultation.status !== 'PENDING_PAYMENT' &&
        consultation.status !== 'PENDING_APPROVAL' &&
        consultation.status !== 'IN_PROGRESS' &&
        consultation.status !== 'PAID' &&
        consultation.status !== 'FINISHED'
      ) {
        client.emit('error', { 
          message: 'La consulta no está disponible',
          consultationId: consultation.id,
        });
        return { error: 'La consulta no está disponible' };
      }

      // Unirse a la sala
      const room = `consultation_${consultationId}`;
      client.join(room);

      // Registrar en el mapa
      if (!this.consultationRooms.has(consultationId)) {
        this.consultationRooms.set(consultationId, new Set());
      }
      this.consultationRooms.get(consultationId)!.add(client.id);

      this.logger.log(`Usuario ${client.userId} se unió a consulta ${consultationId}`);
      this.appendServerCallLog(consultationId, 'INFO', 'joined_consultation', { userId: client.userId, socketId: client.id });
      this.appendServerCallLog(consultationId, 'DEBUG', 'join_consultation_room_state', {
        consultationId,
        roomSocketIds: this.getRoomSocketIds(consultationId),
        roomUserIds: this.getRoomUserIds(consultationId),
        readyUsers: Array.from(this.callReadyParticipants.get(consultationId) || []),
      });

      // Historial: ya validamos permisos arriba; no usar MessagesService.findByConsultation aquí
      // (duplicaba comprobaciones y podía lanzar Forbidden aunque el gateway hubiera autorizado).
      const messages = await this.prisma.message.findMany({
        where: { consultationId },
        orderBy: { createdAt: 'asc' },
      });
      client.emit('message_history', messages);

      // Notificar a otros en la sala
      client.to(room).emit('user_joined', {
        userId: client.userId,
        consultationId,
      });

      // ✅ Retornar éxito para el callback del cliente
      if (this.isClientPaymentLocked(consultation, client)) {
        this.emitPaymentRequired(client, consultation.id);
      }

      return { success: true, consultationId };
    } catch (error) {
      this.logger.error('Error en join_consultation:', error);
      const cid = this.parseIncomingConsultationId(data);
      this.appendServerCallLog(
        cid ?? undefined,
        'ERROR',
        'join_consultation_error',
        { userId: client.userId, error: String(error?.message || error) },
      );
      const clientMessage = this.formatSocketExceptionMessage(error);
      client.emit('error', { message: clientMessage });
      return { error: clientMessage };
    }
  }

  private formatSocketExceptionMessage(error: unknown): string {
    if (error instanceof HttpException) {
      const r = error.getResponse();
      if (typeof r === 'string') {
        return r;
      }
      if (r && typeof r === 'object' && 'message' in r) {
        const m = (r as { message?: string | string[] }).message;
        if (Array.isArray(m)) {
          return m.join(', ');
        }
        if (typeof m === 'string') {
          return m;
        }
      }
      return error.message;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Error al unirse a la consulta';
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
      const consultation = await this.getConsultationRealtimeState(data.consultationId);

      if (!consultation) {
        client.emit('error', { message: 'Consulta no encontrada' });
        return;
      }

      if (consultation.status !== 'IN_PROGRESS' && consultation.status !== 'PAID') {
        client.emit('error', { 
          message: 'La consulta no está disponible',
        });
        return;
      }

      if (this.isClientPaymentLocked(consultation, client)) {
        this.emitPaymentRequired(client, consultation.id);
        client.emit('error', { message: 'Debes pagar la consulta para seguir escribiendo' });
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

      // Emitir a todos en la sala (incluyendo al remitente)
      const room = `consultation_${data.consultationId}`;
      const messageData = {
        id: message.id,
        consultationId: message.consultationId,
        senderType: message.senderType,
        content: message.content,
        createdAt: message.createdAt,
      };
      
      // Enviar a todos en la sala, incluyendo al remitente
      this.server.to(room).emit('new_message', messageData);
      
      // También confirmar al remitente
      client.emit('message_sent', { success: true, message: messageData });

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

    if (client.userId) {
      this.clearCallReadyState(data.consultationId, client.userId);
    }

    client.to(room).emit('user_left', {
      userId: client.userId,
      consultationId: data.consultationId,
    });
  }

  /**
   * WebRTC: Oferta de llamada
   */
  @SubscribeMessage('webrtc_offer')
  async handleWebRTCOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number; offer: any },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'No autenticado' });
      return;
    }

    const consultation = await this.getConsultationRealtimeState(data.consultationId);
    if (!consultation) {
      client.emit('error', { message: 'Consulta no encontrada' });
      return;
    }

    if (!this.consultationAllowsCalls(consultation.status)) {
      client.emit('error', { message: 'La llamada no está disponible' });
      return;
    }

    if (this.isClientPaymentLocked(consultation, client)) {
      this.emitPaymentRequired(client, consultation.id);
      client.emit('error', { message: 'Debes pagar la consulta para continuar la llamada' });
      return;
    }

    const room = `consultation_${data.consultationId}`;
    // Enviar oferta al otro usuario
    client.to(room).emit('webrtc_offer', {
      from: client.userId,
      offer: data.offer,
      consultationId: data.consultationId,
    });

    this.logger.log(`WebRTC offer enviado en consulta ${data.consultationId}`);
    this.appendServerCallLog(data.consultationId, 'INFO', 'webrtc_offer_sent', { from: client.userId });
  }

  /**
   * WebRTC: Respuesta a la oferta
   */
  @SubscribeMessage('webrtc_answer')
  async handleWebRTCAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number; answer: any; to: number },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'No autenticado' });
      return;
    }

    const consultation = await this.getConsultationRealtimeState(data.consultationId);
    if (!consultation) {
      client.emit('error', { message: 'Consulta no encontrada' });
      return;
    }

    if (this.isClientPaymentLocked(consultation, client)) {
      this.emitPaymentRequired(client, consultation.id);
      client.emit('error', { message: 'Debes pagar la consulta para continuar la llamada' });
      return;
    }

    const room = `consultation_${data.consultationId}`;
    // Enviar respuesta al remitente de la oferta
    client.to(room).emit('webrtc_answer', {
      from: client.userId,
      to: data.to,
      answer: data.answer,
      consultationId: data.consultationId,
    });

    this.logger.log(`WebRTC answer enviado en consulta ${data.consultationId}`);
    this.appendServerCallLog(data.consultationId, 'INFO', 'webrtc_answer_sent', { from: client.userId, to: data.to });
  }

  /**
   * WebRTC: Candidato ICE
   */
  @SubscribeMessage('webrtc_ice_candidate')
  async handleWebRTCIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number; candidate: any },
  ) {
    if (!client.userId) {
      return;
    }

    const consultation = await this.getConsultationRealtimeState(data.consultationId);
    if (!consultation) {
      return;
    }

    if (this.isClientPaymentLocked(consultation, client)) {
      this.emitPaymentRequired(client, consultation.id);
      return;
    }

    const room = `consultation_${data.consultationId}`;
    // Enviar candidato ICE al otro usuario
    client.to(room).emit('webrtc_ice_candidate', {
      from: client.userId,
      candidate: data.candidate,
      consultationId: data.consultationId,
    });
    this.appendServerCallLog(data.consultationId, 'DEBUG', 'ice_candidate_relayed', { from: client.userId });
  }

  /**
   * Solicitar llamada de voz/video
   */
  @SubscribeMessage('call_request')
  async handleCallRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number; type: 'VOICE' | 'VIDEO' },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'No autenticado' });
      return;
    }

    const consultation = await this.getConsultationRealtimeState(data.consultationId);
    if (!consultation) {
      client.emit('error', { message: 'Consulta no encontrada' });
      return;
    }

    if (!this.consultationAllowsCalls(consultation.status)) {
      client.emit('error', { message: 'La llamada no está disponible' });
      return;
    }

    if (this.isClientPaymentLocked(consultation, client)) {
      this.emitPaymentRequired(client, consultation.id);
      client.emit('error', { message: 'Debes pagar la consulta para iniciar la llamada' });
      return;
    }

    const room = `consultation_${data.consultationId}`;
    client.to(room).emit('call_request', {
      from: client.userId,
      type: data.type,
      consultationId: data.consultationId,
    });

    this.logger.log(`Solicitud de llamada ${data.type} en consulta ${data.consultationId}`);
    this.appendServerCallLog(data.consultationId, 'INFO', 'call_request', { from: client.userId, type: data.type });
  }

  /**
   * Aceptar llamada
   */
  @SubscribeMessage('call_accept')
  async handleCallAccept(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number; from: number; type?: 'VOICE' | 'VIDEO' },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'No autenticado' });
      return;
    }

    const consultation = await this.getConsultationRealtimeState(data.consultationId);
    if (!consultation) {
      client.emit('error', { message: 'Consulta no encontrada' });
      return;
    }

    if (this.isClientPaymentLocked(consultation, client)) {
      this.emitPaymentRequired(client, consultation.id);
      client.emit('error', { message: 'Debes pagar la consulta para aceptar la llamada' });
      return;
    }

    const room = `consultation_${data.consultationId}`;
    client.to(room).emit('call_accept', {
      from: client.userId,
      to: data.from,
      type: data.type,
      consultationId: data.consultationId,
    });

    this.logger.log(`Llamada aceptada en consulta ${data.consultationId}`);
    this.appendServerCallLog(data.consultationId, 'INFO', 'call_accept', { by: client.userId, to: data.from, type: data.type });
  }

  /**
   * Rechazar llamada
   */
  @SubscribeMessage('call_reject')
  async handleCallReject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number; from: number; type?: 'VOICE' | 'VIDEO'; reason?: string },
  ) {
    if (!client.userId) {
      return;
    }

    const room = `consultation_${data.consultationId}`;
    client.to(room).emit('call_reject', {
      from: client.userId,
      to: data.from,
      type: data.type,
      reason: data.reason,
      consultationId: data.consultationId,
    });

    this.logger.log(`Llamada rechazada en consulta ${data.consultationId}`);
    this.appendServerCallLog(data.consultationId, 'INFO', 'call_reject', { by: client.userId, to: data.from, reason: data.reason });
  }

  /**
   * Terminar llamada
   */
  @SubscribeMessage('call_end')
  async handleCallEnd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number; type?: 'VOICE' | 'VIDEO'; reason?: string },
  ) {
    if (!client.userId) {
      return;
    }

    this.resetConsultationCallState(data.consultationId, 'call_end');

    const room = `consultation_${data.consultationId}`;
    client.to(room).emit('call_end', {
      from: client.userId,
      type: data.type,
      reason: data.reason,
      consultationId: data.consultationId,
    });

    this.logger.log(`Llamada terminada en consulta ${data.consultationId}`);
    this.appendServerCallLog(data.consultationId, 'INFO', 'call_end', { by: client.userId, reason: data.reason });
  }

  @SubscribeMessage('call_ready')
  async handleCallReady(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { consultationId: number },
  ) {
    if (!client.userId) {
      return;
    }

    const consultationId = Number(data.consultationId);
    if (!Number.isFinite(consultationId) || consultationId <= 0) {
      // Evitar estados corruptos si el cliente manda string/undefined
      return;
    }

    const consultation = await this.getConsultationRealtimeState(consultationId);
    if (!consultation) {
      client.emit('error', { message: 'Consulta no encontrada' });
      return;
    }

    if (this.isClientPaymentLocked(consultation, client)) {
      this.emitPaymentRequired(client, consultation.id);
      return;
    }

    const room = `consultation_${consultationId}`;
    const readyParticipants = this.markUserCallReady(consultationId, client.userId);

    const readyUsers = Array.from(readyParticipants);
    const canStartHandshake = readyParticipants.size >= 2;
    const roomUserIds = this.getRoomUserIds(consultationId);
    const bothUsersInRoom = roomUserIds.length >= 2;

    // Emitimos siempre el estado actual de readiness para tolerar reconexiones o eventos perdidos.
    this.server.to(room).emit('call_ready', {
      consultationId,
      from: client.userId,
      readyUsers,
      canStartHandshake,
    });

    this.logger.log(
      `call_ready consultation=${consultationId} from=${client.userId} readyUsers=[${readyUsers.join(',')}] roomUsers=[${roomUserIds.join(',')}] canStartHandshake=${canStartHandshake}`,
    );

    if (canStartHandshake && !this.requestOfferEmittedForConsultation.has(consultationId)) {
      this.logger.log(
        `Participantes listos para WebRTC en consulta ${consultationId}: ${readyUsers.join(', ')}`,
      );
      // Sugerir al iniciador que envíe oferta si aún no lo hizo (best-effort).
      this.server.to(room).emit('request_offer', { consultationId });
      this.appendServerCallLog(consultationId, 'DEBUG', 'request_offer_emitted', { readyUsers });
      this.requestOfferEmittedForConsultation.add(consultationId);
    }
    if (bothUsersInRoom) {
      this.appendServerCallLog(consultationId, 'INFO', 'both_users_confirmed_in_room', {
        consultationId,
        roomUserIds,
      });
    } else {
      // Recomendado: avisar al cliente para que fuerce rejoin si falta contraparte.
      client.emit('request_rejoin_consultation', {
        consultationId,
        reason: 'OTHER_PARTICIPANT_NOT_IN_ROOM',
      });
    }

    this.appendServerCallLog(consultationId, 'DEBUG', 'call_ready_state', {
      from: client.userId,
      readyUsers,
      canStartHandshake,
      roomUserIds,
      bothUsersInRoom,
    });
  }

  /**
   * Iniciar llamada automáticamente cuando el veterinario acepta una consulta VOICE/VIDEO
   * Este método se llama desde el servicio de consultas cuando se acepta una consulta
   */
  async autoStartCall(consultationId: number, consultationType: string, veterinarianUserId: number, userUserId: number) {
    try {
      const room = `consultation_${consultationId}`;
      
      // Obtener sockets del veterinario y del usuario
      const vetSockets = this.userSockets?.get?.(veterinarianUserId) || new Set();
      const userSockets = this.userSockets?.get?.(userUserId) || new Set();

      // Emitir evento a ambos usuarios para iniciar la llamada automáticamente
      const callType = consultationType === 'VOICE' ? 'VOICE' : 'VIDEO';
      
      // El veterinario inicia la oferta WebRTC; el cliente espera y responde.
      userSockets.forEach(socketId => {
        const socket = this.getSocketById(socketId);
        if (socket?.emit) {
          socket.emit('auto_start_call', {
            consultationId,
            type: callType,
            from: veterinarianUserId,
            initiator: false,
          });
        }
      });

      // Notificar al veterinario que debe iniciar la llamada
      vetSockets.forEach(socketId => {
        const socket = this.getSocketById(socketId);
        if (socket?.emit) {
          socket.emit('auto_start_call', {
            consultationId,
            type: callType,
            from: userUserId,
            initiator: true,
          });
        }
      });

      this.logger.log(`Llamada automática iniciada para consulta ${consultationId} (${callType})`);
      this.appendServerCallLog(consultationId, 'INFO', 'auto_start_call', { callType });
    } catch (error) {
      this.logger.error(`Error iniciando llamada automática:`, error);
      this.appendServerCallLog(consultationId, 'ERROR', 'auto_start_call_error', {
        error: String(error?.message || error),
        stack: error?.stack,
      });
    }
  }

  notifyPaymentApproved(consultationId: number, veterinarianUserId: number, userUserId: number) {
    const payload = {
      consultationId,
      status: 'APPROVED',
      timestamp: new Date().toISOString(),
    };

    const userSockets = this.userSockets.get(userUserId) || new Set();
    userSockets.forEach((socketId) => {
      this.getSocketById(socketId)?.emit('payment_updated', payload);
    });

    const vetSockets = this.userSockets.get(veterinarianUserId) || new Set();
    vetSockets.forEach((socketId) => {
      this.getSocketById(socketId)?.emit('payment_updated', payload);
    });

    this.server.to(`consultation_${consultationId}`).emit('payment_updated', payload);
    this.logger.log(`Pago aprobado notificado en tiempo real para consulta ${consultationId}`);
  }

  notifyConsultationEndedNoPayment(consultationId: number, veterinarianUserId: number, userUserId: number) {
    const payload = {
      consultationId,
      reason: 'USER_DECLINED_PAYMENT',
      message: 'El usuario decidió no pagar y la consulta fue finalizada.',
      timestamp: new Date().toISOString(),
    };

    const userSockets = this.userSockets.get(userUserId) || new Set();
    userSockets.forEach((socketId) => {
      this.getSocketById(socketId)?.emit('consultation_ended_no_payment', payload);
    });

    const vetSockets = this.userSockets.get(veterinarianUserId) || new Set();
    vetSockets.forEach((socketId) => {
      this.getSocketById(socketId)?.emit('consultation_ended_no_payment', payload);
    });

    this.server.to(`consultation_${consultationId}`).emit('consultation_ended_no_payment', payload);
    this.server.to(`consultation_${consultationId}`).emit('call_end', {
      consultationId,
      reason: 'USER_DECLINED_PAYMENT',
      from: userUserId,
    });
    this.resetConsultationCallState(consultationId, 'consultation_ended_no_payment');
    this.logger.log(`Consulta ${consultationId} finalizada por no pago del usuario`);
  }
}
