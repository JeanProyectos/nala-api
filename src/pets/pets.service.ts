import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { UserRole } from '@prisma/client';
import { mapPetResponse, mapPetsResponse } from './pet-mapper';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea una nueva mascota para el usuario autenticado
   */
  async create(userId: number, createPetDto: CreatePetDto) {
    const { birthDate, type, ...rest } = createPetDto;
    
    // Mapear 'type' del DTO a 'species' en la BD
    const pet = await this.prisma.pet.create({
      data: {
        ...rest,
        species: type, // La BD usa 'species', el DTO usa 'type'
        birthDate: birthDate ? new Date(birthDate) : null,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return mapPetResponse(pet);
  }

  /**
   * Obtiene todas las mascotas según el rol del usuario
   * - USER: Solo sus mascotas
   * - VET: Mascotas asignadas (por ahora todas, puede mejorarse con relación)
   * - ADMIN: Todas las mascotas
   */
  async findAll(userId: number, userRole: UserRole) {
    const where: any = { deletedAt: null }; // Usar deletedAt en lugar de isDeleted

    if (userRole === 'USER') {
      where.ownerId = userId;
    }
    // VET y ADMIN pueden ver todas las mascotas

    const pets = await this.prisma.pet.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return mapPetsResponse(pets);
  }

  /**
   * Obtiene una mascota por ID
   * - USER: Solo si es su mascota
   * - VET/ADMIN: Pueden ver cualquier mascota
   */
  async findOne(id: number, userId: number, userRole: UserRole) {
    const pet = await this.prisma.pet.findFirst({
      where: {
        id,
        deletedAt: null, // Usar deletedAt en lugar de isDeleted
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        vaccines: {
          orderBy: { appliedDate: 'desc' },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    // USER solo puede ver sus propias mascotas
    if (userRole === 'USER' && pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta mascota');
    }

    return mapPetResponse(pet);
  }

  /**
   * Actualiza una mascota
   * - USER: Solo sus mascotas
   * - VET/ADMIN: Cualquier mascota
   */
  async update(id: number, userId: number, userRole: UserRole, updatePetDto: UpdatePetDto) {
    const existingPet = await this.prisma.pet.findFirst({
      where: { id, deletedAt: null }, // Usar deletedAt
    });

    if (!existingPet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (userRole === 'USER' && existingPet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permiso para actualizar esta mascota');
    }

    const { birthDate, type, ...rest } = updatePetDto;
    const updateData: any = {
      ...rest,
      birthDate: birthDate ? new Date(birthDate) : undefined,
    };

    // Si viene 'type' en el DTO, mapearlo a 'species'
    if (type !== undefined) {
      updateData.species = type;
    }

    const updatedPet = await this.prisma.pet.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return mapPetResponse(updatedPet);
  }

  /**
   * Elimina una mascota (soft delete)
   * - USER: Solo sus mascotas
   * - VET/ADMIN: Cualquier mascota
   */
  async remove(id: number, userId: number, userRole: UserRole) {
    const pet = await this.prisma.pet.findFirst({
      where: { id, deletedAt: null }, // Usar deletedAt
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (userRole === 'USER' && pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta mascota');
    }

    // Soft delete usando deletedAt
    return this.prisma.pet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

