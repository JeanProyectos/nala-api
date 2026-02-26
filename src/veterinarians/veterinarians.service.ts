import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { SearchVeterinariansDto } from './dto/search-veterinarians.dto';
import { VeterinarianStatus } from '@prisma/client';

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

    return this.prisma.veterinarian.create({
      data: {
        ...createVeterinarianDto,
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

    return this.prisma.veterinarian.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
   * Actualiza el perfil del veterinario
   */
  async update(userId: number, updateVeterinarianDto: UpdateVeterinarianDto) {
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { userId },
    });

    if (!veterinarian) {
      throw new NotFoundException('No tienes un perfil de veterinario');
    }

    return this.prisma.veterinarian.update({
      where: { userId },
      data: updateVeterinarianDto,
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
