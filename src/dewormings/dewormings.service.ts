import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDewormingDto } from './dto/create-deworming.dto';
import { UpdateDewormingDto } from './dto/update-deworming.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class DewormingsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, role: UserRole, createDewormingDto: CreateDewormingDto) {
    // Verificar que la mascota existe y pertenece al usuario (o es VET/ADMIN)
    const pet = await this.prisma.pet.findUnique({
      where: { id: createDewormingDto.petId },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (role === 'USER' && pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para agregar desparasitantes a esta mascota');
    }

    return this.prisma.deworming.create({
      data: {
        ...createDewormingDto,
        appliedDate: new Date(createDewormingDto.appliedDate),
        nextDate: createDewormingDto.nextDate ? new Date(createDewormingDto.nextDate) : null,
      },
    });
  }

  async findByPet(petId: number, userId: number, role: UserRole) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (role === 'USER' && pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para ver esta mascota');
    }

    return this.prisma.deworming.findMany({
      where: { petId },
      orderBy: { appliedDate: 'desc' },
    });
  }

  async findOne(id: number, userId: number, role: UserRole) {
    const deworming = await this.prisma.deworming.findUnique({
      where: { id },
      include: { pet: true },
    });

    if (!deworming) {
      throw new NotFoundException('Desparasitante no encontrado');
    }

    if (role === 'USER' && deworming.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para ver este desparasitante');
    }

    return deworming;
  }

  async update(id: number, userId: number, role: UserRole, updateDewormingDto: UpdateDewormingDto) {
    const deworming = await this.prisma.deworming.findUnique({
      where: { id },
      include: { pet: true },
    });

    if (!deworming) {
      throw new NotFoundException('Desparasitante no encontrado');
    }

    if (role === 'USER' && deworming.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para actualizar este desparasitante');
    }

    const updateData: any = { ...updateDewormingDto };
    if ((updateDewormingDto as any).appliedDate) {
      updateData.appliedDate = new Date((updateDewormingDto as any).appliedDate);
    }
    if ((updateDewormingDto as any).nextDate) {
      updateData.nextDate = new Date((updateDewormingDto as any).nextDate);
    }

    return this.prisma.deworming.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number, userId: number, role: UserRole) {
    const deworming = await this.prisma.deworming.findUnique({
      where: { id },
      include: { pet: true },
    });

    if (!deworming) {
      throw new NotFoundException('Desparasitante no encontrado');
    }

    if (role === 'USER' && deworming.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para eliminar este desparasitante');
    }

    return this.prisma.deworming.delete({
      where: { id },
    });
  }
}
