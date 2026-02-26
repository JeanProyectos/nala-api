import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHealthHistoryDto } from './dto/create-health-history.dto';
import { UpdateHealthHistoryDto } from './dto/update-health-history.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class HealthHistoryService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, role: UserRole, createHealthHistoryDto: CreateHealthHistoryDto) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: createHealthHistoryDto.petId },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (role === 'USER' && pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para agregar historial a esta mascota');
    }

    return this.prisma.healthHistory.create({
      data: {
        ...createHealthHistoryDto,
        date: new Date(createHealthHistoryDto.date),
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

    return this.prisma.healthHistory.findMany({
      where: { petId },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number, userId: number, role: UserRole) {
    const healthHistory = await this.prisma.healthHistory.findUnique({
      where: { id },
      include: { pet: true },
    });

    if (!healthHistory) {
      throw new NotFoundException('Registro de historial no encontrado');
    }

    if (role === 'USER' && healthHistory.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para ver este registro');
    }

    return healthHistory;
  }

  async update(id: number, userId: number, role: UserRole, updateHealthHistoryDto: UpdateHealthHistoryDto) {
    const healthHistory = await this.prisma.healthHistory.findUnique({
      where: { id },
      include: { pet: true },
    });

    if (!healthHistory) {
      throw new NotFoundException('Registro de historial no encontrado');
    }

    if (role === 'USER' && healthHistory.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para actualizar este registro');
    }

    const updateData: any = { ...updateHealthHistoryDto };
    if ((updateHealthHistoryDto as any).date) {
      updateData.date = new Date((updateHealthHistoryDto as any).date);
    }

    return this.prisma.healthHistory.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number, userId: number, role: UserRole) {
    const healthHistory = await this.prisma.healthHistory.findUnique({
      where: { id },
      include: { pet: true },
    });

    if (!healthHistory) {
      throw new NotFoundException('Registro de historial no encontrado');
    }

    if (role === 'USER' && healthHistory.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para eliminar este registro');
    }

    return this.prisma.healthHistory.delete({
      where: { id },
    });
  }
}
