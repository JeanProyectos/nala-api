import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { RateConsultationDto } from './dto/rate-consultation.dto';
import { ConsultationStatus, ConsultationType } from '@prisma/client';
import { VeterinariansService } from '../veterinarians/veterinarians.service';
import { MarketplacePaymentsService } from '../marketplace-payments/marketplace-payments.service';

@Injectable()
export class ConsultationsService {
  constructor(
    private prisma: PrismaService,
    private veterinariansService: VeterinariansService,
    private marketplaceService: MarketplacePaymentsService,
  ) {}

  /**
   * Crea una nueva consulta
   */
  async create(userId: number, createConsultationDto: CreateConsultationDto) {
    // Verificar que el veterinario existe y está activo
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { id: createConsultationDto.veterinarianId },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    if (
      veterinarian.status !== 'ACTIVE' &&
      veterinarian.status !== 'VERIFIED'
    ) {
      throw new ForbiddenException('Este veterinario no está disponible');
    }

    // Verificar que la mascota pertenece al usuario (si se especifica)
    if (createConsultationDto.petId) {
      const pet = await this.prisma.pet.findUnique({
        where: { id: createConsultationDto.petId },
      });

      if (!pet || pet.ownerId !== userId) {
        throw new ForbiddenException('La mascota no te pertenece');
      }
    }

    // Obtener precio según el tipo de consulta
    let price = 0;
    switch (createConsultationDto.type) {
      case ConsultationType.CHAT:
        price = veterinarian.priceChat || 0;
        break;
      case ConsultationType.VOICE:
        price = veterinarian.priceVoice || 0;
        break;
      case ConsultationType.VIDEO:
        price = veterinarian.priceVideo || 0;
        break;
    }

    if (price <= 0) {
      throw new BadRequestException('El veterinario no tiene precio configurado para este tipo de consulta');
    }

    // Calcular comisiones
    const { platformFee, veterinarianAmount } = await this.marketplaceService.calculateFees(price);

    const consultation = await this.prisma.consultation.create({
      data: {
        userId,
        veterinarianId: createConsultationDto.veterinarianId,
        type: createConsultationDto.type,
        petId: createConsultationDto.petId,
        price,
        platformFee,
        veterinarianAmount,
        status: ConsultationStatus.PENDING_PAYMENT,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        veterinarian: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    });

    return consultation;
  }

  /**
   * Acepta una consulta (solo veterinario, cambia de PENDING_PAYMENT a IN_PROGRESS)
   */
  async accept(consultationId: number, veterinarianId: number) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    if (consultation.veterinarianId !== veterinarianId) {
      throw new ForbiddenException('No tienes permisos para esta consulta');
    }

    if (consultation.status !== ConsultationStatus.PENDING_PAYMENT) {
      throw new BadRequestException('La consulta no está pendiente de aceptación');
    }

    return this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: ConsultationStatus.IN_PROGRESS,
        startDate: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        veterinarian: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
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
   * Inicia una consulta (cambia estado a ACTIVE)
   */
  async start(consultationId: number, userId: number, isVet: boolean) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    // Verificar permisos
    if (isVet) {
      if (consultation.veterinarianId !== userId) {
        throw new ForbiddenException('No tienes permisos para esta consulta');
      }
    } else {
      if (consultation.userId !== userId) {
        throw new ForbiddenException('No tienes permisos para esta consulta');
      }
    }

    // Permitir iniciar consultas en PENDING_PAYMENT (pago después)
    if (consultation.status !== ConsultationStatus.PENDING_PAYMENT && consultation.status !== ConsultationStatus.PAID) {
      throw new ForbiddenException('La consulta no está disponible para iniciar');
    }

    return this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: ConsultationStatus.IN_PROGRESS,
        startDate: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        veterinarian: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
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
   * Finaliza una consulta
   */
  async finish(consultationId: number, userId: number, isVet: boolean) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    // Verificar permisos
    if (isVet) {
      if (consultation.veterinarianId !== userId) {
        throw new ForbiddenException('No tienes permisos para esta consulta');
      }
    } else {
      if (consultation.userId !== userId) {
        throw new ForbiddenException('No tienes permisos para esta consulta');
      }
    }

    if (consultation.status !== ConsultationStatus.IN_PROGRESS) {
      throw new ForbiddenException('La consulta no está en progreso');
    }

    const updated = await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: ConsultationStatus.FINISHED,
        endDate: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        veterinarian: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Actualizar contador de consultas del veterinario
    await this.prisma.veterinarian.update({
      where: { id: consultation.veterinarianId },
      data: {
        totalConsultations: {
          increment: 1,
        },
      },
    });

    return updated;
  }

  /**
   * Obtiene las consultas del usuario
   */
  async findByUser(userId: number) {
    return this.prisma.consultation.findMany({
      where: { userId },
      include: {
        veterinarian: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        rating: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene las consultas del veterinario
   */
  async findByVeterinarian(veterinarianId: number) {
    return this.prisma.consultation.findMany({
      where: { veterinarianId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene una consulta por ID
   */
  async findOne(id: number, userId: number) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        veterinarian: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        rating: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    // Verificar que el usuario tenga acceso
    if (consultation.userId !== userId) {
      // Verificar si es el veterinario
      const vet = await this.prisma.veterinarian.findUnique({
        where: { userId },
      });
      if (!vet || vet.id !== consultation.veterinarianId) {
        throw new ForbiddenException('No tienes permisos para ver esta consulta');
      }
    }

    return consultation;
  }

  /**
   * Califica una consulta
   */
  async rate(consultationId: number, userId: number, rateDto: RateConsultationDto) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        rating: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    if (consultation.userId !== userId) {
      throw new ForbiddenException('Solo el usuario puede calificar la consulta');
    }

    if (consultation.status !== ConsultationStatus.FINISHED) {
      throw new BadRequestException('Solo se pueden calificar consultas finalizadas');
    }

    if (consultation.rating) {
      throw new BadRequestException('Esta consulta ya fue calificada');
    }

    const rating = await this.prisma.consultationRating.create({
      data: {
        consultationId,
        veterinarianId: consultation.veterinarianId,
        rating: rateDto.rating,
        comment: rateDto.comment,
      },
    });

    // Actualizar rating promedio del veterinario
    await this.veterinariansService.updateRating(consultation.veterinarianId);

    return rating;
  }
}
