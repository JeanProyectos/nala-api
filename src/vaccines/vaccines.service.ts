import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { UpdateVaccineDto } from './dto/update-vaccine.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class VaccinesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea una nueva vacuna para una mascota
   * - USER: Solo puede registrar vacunas en sus propias mascotas
   * - VET/ADMIN: Pueden registrar vacunas en cualquier mascota
   */
  async create(userId: number, userRole: UserRole, createVaccineDto: CreateVaccineDto) {
    const { petId, appliedDate, nextDose, ...rest } = createVaccineDto;

    // Verificar que la mascota existe
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, deletedAt: null },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    // USER solo puede registrar vacunas en sus propias mascotas
    if (userRole === 'USER' && pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permiso para registrar vacunas en esta mascota');
    }

    return this.prisma.vaccine.create({
      data: {
        ...rest,
        petId,
        appliedDate: new Date(appliedDate),
        nextDose: nextDose ? new Date(nextDose) : null,
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true, // La BD usa 'species'
          },
        },
      },
    });
  }

  /**
   * Obtiene todas las vacunas de una mascota
   */
  async findByPet(petId: number, userId: number, userRole: UserRole) {
    // Verificar que la mascota existe y pertenece al usuario (si es USER)
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, deletedAt: null },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (userRole === 'USER' && pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver las vacunas de esta mascota');
    }

    return this.prisma.vaccine.findMany({
      where: { petId },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true, // La BD usa 'species'
          },
        },
      },
      orderBy: { appliedDate: 'desc' },
    });
  }

  /**
   * Obtiene una vacuna por ID
   */
  async findOne(id: number, userId: number, userRole: UserRole) {
    const vaccine = await this.prisma.vaccine.findUnique({
      where: { id },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            ownerId: true,
          },
        },
      },
    });

    if (!vaccine) {
      throw new NotFoundException('Vacuna no encontrada');
    }

    // USER solo puede ver vacunas de sus propias mascotas
    if (userRole === 'USER' && vaccine.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta vacuna');
    }

    return vaccine;
  }

  /**
   * Actualiza una vacuna
   */
  async update(id: number, userId: number, userRole: UserRole, updateVaccineDto: UpdateVaccineDto) {
    const vaccine = await this.prisma.vaccine.findUnique({
      where: { id },
      include: {
        pet: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!vaccine) {
      throw new NotFoundException('Vacuna no encontrada');
    }

    if (userRole === 'USER' && vaccine.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permiso para actualizar esta vacuna');
    }

    const { appliedDate, nextDose, ...rest } = updateVaccineDto;

    return this.prisma.vaccine.update({
      where: { id },
      data: {
        ...rest,
        appliedDate: appliedDate ? new Date(appliedDate) : undefined,
        nextDose: nextDose ? new Date(nextDose) : undefined,
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true, // La BD usa 'species'
          },
        },
      },
    });
  }

  /**
   * Elimina una vacuna
   */
  async remove(id: number, userId: number, userRole: UserRole) {
    const vaccine = await this.prisma.vaccine.findUnique({
      where: { id },
      include: {
        pet: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!vaccine) {
      throw new NotFoundException('Vacuna no encontrada');
    }

    if (userRole === 'USER' && vaccine.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta vacuna');
    }

    return this.prisma.vaccine.delete({
      where: { id },
    });
  }
}
