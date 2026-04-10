import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { SearchVeterinariansDto } from './dto/search-veterinarians.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { VeterinarianStatus, ConsultationStatus } from '@prisma/client';
import { AVAILABILITY_STATUS } from './availability-status.constants';

@Injectable()
export class VeterinariansService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un perfil de veterinario
   */
  async create(userId: number, createVeterinarianDto: CreateVeterinarianDto) {
    // Verificar que el usuario no tenga ya un perfil de veterinario
    const existing = await this.prisma.veterinarian.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ForbiddenException('Ya tienes un perfil de veterinario');
    }

    // Filtrar campos undefined y pricePerConsultation (no existe en el modelo)
    const { pricePerConsultation, ...cleanData } = createVeterinarianDto as any;
    const dataToSave = Object.fromEntries(
      Object.entries(cleanData).filter(([_, value]) => value !== undefined)
    ) as any;

    return this.prisma.veterinarian.create({
      data: {
        ...dataToSave,
        userId,
        status: VeterinarianStatus.PENDING, // Pendiente de verificación
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Busca veterinarios con filtros
   */
  async search(searchDto: SearchVeterinariansDto) {
    const where: any = {
      status: {
        in: [VeterinarianStatus.ACTIVE, VeterinarianStatus.VERIFIED],
      },
      // Solo mostrar veterinarios disponibles o en consulta (no los no disponibles)
      availabilityStatus: {
        in: [
          AVAILABILITY_STATUS.AVAILABLE,
          AVAILABILITY_STATUS.IN_CONSULTATION,
        ],
      },
    };

    if (searchDto.country) {
      where.country = { contains: searchDto.country, mode: 'insensitive' };
    }

    if (searchDto.city) {
      where.city = { contains: searchDto.city, mode: 'insensitive' };
    }

    if (searchDto.specialty) {
      where.specialty = searchDto.specialty;
    }

    if (searchDto.language) {
      where.languages = { has: searchDto.language };
    }

    if (searchDto.search) {
      where.fullName = { contains: searchDto.search, mode: 'insensitive' };
    }

    const veterinarians = await this.prisma.veterinarian.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        consultations: {
          where: {
            status: ConsultationStatus.IN_PROGRESS,
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            ratings: true,
          },
        },
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalConsultations: 'desc' },
      ],
    });

    // Calcular estado de disponibilidad automáticamente si está en consulta
    return veterinarians.map((vet) => {
      const isInConsultation = vet.consultations && vet.consultations.length > 0;
      
      // Si el veterinario está UNAVAILABLE manualmente, mantener ese estado
      // Si está AVAILABLE y tiene consultas activas, cambiar a IN_CONSULTATION
      // Si está IN_CONSULTATION pero no tiene consultas, volver a AVAILABLE (solo si no está UNAVAILABLE)
      let finalAvailabilityStatus = vet.availabilityStatus;
      
      if (vet.availabilityStatus === AVAILABILITY_STATUS.UNAVAILABLE) {
        // Mantener UNAVAILABLE si el veterinario lo configuró manualmente
        finalAvailabilityStatus = AVAILABILITY_STATUS.UNAVAILABLE;
      } else if (
        isInConsultation &&
        vet.availabilityStatus === AVAILABILITY_STATUS.AVAILABLE
      ) {
        // Si tiene consultas activas y está disponible, cambiar a en consulta
        finalAvailabilityStatus = AVAILABILITY_STATUS.IN_CONSULTATION;
      } else if (
        !isInConsultation &&
        vet.availabilityStatus === AVAILABILITY_STATUS.IN_CONSULTATION
      ) {
        // Si no tiene consultas pero está marcado como en consulta, volver a disponible
        finalAvailabilityStatus = AVAILABILITY_STATUS.AVAILABLE;
      }

      // Remover consultas del objeto para no exponer datos innecesarios
      const { consultations, ...vetWithoutConsultations } = vet;
      
      return {
        ...vetWithoutConsultations,
        availabilityStatus: finalAvailabilityStatus,
        isInConsultation,
      };
    });
  }

  /**
   * Obtiene un veterinario por ID
   */
  async findOne(id: number) {
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ratings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            consultation: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            consultations: true,
            ratings: true,
          },
        },
      },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    return veterinarian;
  }

  /**
   * Obtiene el perfil del veterinario del usuario autenticado
   */
  async findMyProfile(userId: number) {
    return this.prisma.veterinarian.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Actualiza el perfil del veterinario (o lo crea si no existe)
   */
  async update(userId: number, updateVeterinarianDto: UpdateVeterinarianDto) {
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { userId },
    });

    // Filtrar campos undefined y pricePerConsultation (no existe en el modelo)
    const { pricePerConsultation, ...cleanData } = updateVeterinarianDto as any;
    const dataToSave = Object.fromEntries(
      Object.entries(cleanData).filter(([_, value]) => value !== undefined)
    ) as any;

    if (!veterinarian) {
      // Validar campos requeridos para crear
      if (!dataToSave.fullName || !dataToSave.country || !dataToSave.city || 
          !dataToSave.specialty || dataToSave.yearsExperience === undefined || 
          !dataToSave.languages || dataToSave.languages.length === 0) {
        throw new ForbiddenException(
          'Faltan campos requeridos: fullName, country, city, specialty, yearsExperience, languages'
        );
      }

      // Si no existe, crear el perfil
      return this.prisma.veterinarian.create({
        data: {
          ...dataToSave,
          userId,
          status: VeterinarianStatus.PENDING, // Pendiente de verificación
          availabilityStatus: AVAILABILITY_STATUS.AVAILABLE, // Disponible por defecto
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    // Si existe, actualizar
    return this.prisma.veterinarian.update({
      where: { userId },
      data: dataToSave,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Actualiza el rating promedio de un veterinario
   */
  async updateRating(veterinarianId: number) {
    const ratings = await this.prisma.consultationRating.findMany({
      where: { veterinarianId },
      select: { rating: true },
    });

    if (ratings.length === 0) {
      return;
    }

    const averageRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await this.prisma.veterinarian.update({
      where: { id: veterinarianId },
      data: { averageRating },
    });
  }

  /**
   * Obtiene todos los veterinarios pendientes de verificación (solo para admin)
   */
  async findPending() {
    return this.prisma.veterinarian.findMany({
      where: {
        status: VeterinarianStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            consultations: true,
            ratings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Más antiguos primero
      },
    });
  }

  /**
   * Actualiza el estado de disponibilidad del veterinario
   */
  async updateAvailability(userId: number, updateDto: UpdateAvailabilityDto) {
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { userId },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    return this.prisma.veterinarian.update({
      where: { userId },
      data: {
        availabilityStatus: updateDto.availabilityStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Verifica (aprueba o rechaza) un veterinario (solo para admin)
   */
  async verify(
    veterinarianId: number,
    adminId: number,
    status: VeterinarianStatus,
    notes?: string,
  ) {
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { id: veterinarianId },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    if (veterinarian.status !== VeterinarianStatus.PENDING) {
      throw new ForbiddenException(
        'Este veterinario ya fue verificado anteriormente',
      );
    }

    if (status !== VeterinarianStatus.VERIFIED && status !== VeterinarianStatus.INACTIVE) {
      throw new ForbiddenException(
        'El status debe ser VERIFIED (aprobado) o INACTIVE (rechazado)',
      );
    }

    return this.prisma.veterinarian.update({
      where: { id: veterinarianId },
      data: {
        status,
        // Notas de verificación (puedes agregar estos campos al schema si quieres)
        // verifiedBy: adminId,
        // verifiedAt: new Date(),
        // verificationNotes: notes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
