import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un mensaje en una consulta
   */
  async create(
    consultationId: number,
    senderType: 'user' | 'vet',
    content: string,
    senderId: number,
  ) {
    // Verificar que la consulta existe y el usuario tiene acceso
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    // Verificar permisos
    if (senderType === 'user') {
      if (consultation.userId !== senderId) {
        throw new ForbiddenException('No tienes permisos para esta consulta');
      }
    } else {
      // Verificar que es el veterinario
      const vet = await this.prisma.veterinarian.findUnique({
        where: { userId: senderId },
      });
      if (!vet || vet.id !== consultation.veterinarianId) {
        throw new ForbiddenException('No tienes permisos para esta consulta');
      }
    }

    // Permitir mensajes en PENDING_PAYMENT, IN_PROGRESS o PAID (pago después)
    if (consultation.status !== 'PENDING_PAYMENT' && consultation.status !== 'IN_PROGRESS' && consultation.status !== 'PAID') {
      throw new ForbiddenException('La consulta no está disponible para enviar mensajes');
    }

    return this.prisma.message.create({
      data: {
        consultationId,
        senderType,
        content,
      },
    });
  }

  /**
   * Obtiene los mensajes de una consulta
   */
  async findByConsultation(consultationId: number, userId: number) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    // Verificar permisos
    if (consultation.userId !== userId) {
      const vet = await this.prisma.veterinarian.findUnique({
        where: { userId },
      });
      if (!vet || vet.id !== consultation.veterinarianId) {
        throw new ForbiddenException('No tienes permisos para ver esta consulta');
      }
    }

    return this.prisma.message.findMany({
      where: { consultationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
