import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea una nueva mascota para el usuario autenticado
   */
  async create(userId: number, createPetDto: CreatePetDto) {
    return this.prisma.pet.create({
      data: {
        ...createPetDto,
        ownerId: userId,
      },
    });
  }

  /**
   * Obtiene todas las mascotas del usuario autenticado
   */
  async findAll(userId: number) {
    return this.prisma.pet.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene una mascota por ID (solo si pertenece al usuario)
   */
  async findOne(id: number, userId: number) {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta mascota');
    }

    return pet;
  }

  /**
   * Actualiza una mascota (solo si pertenece al usuario)
   */
  async update(id: number, userId: number, updatePetDto: UpdatePetDto) {
    // Verificar que la mascota existe y pertenece al usuario
    await this.findOne(id, userId);

    return this.prisma.pet.update({
      where: { id },
      data: updatePetDto,
    });
  }

  /**
   * Elimina una mascota (solo si pertenece al usuario)
   */
  async remove(id: number, userId: number) {
    // Verificar que la mascota existe y pertenece al usuario
    await this.findOne(id, userId);

    return this.prisma.pet.delete({
      where: { id },
    });
  }
}

