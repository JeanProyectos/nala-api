import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AllergiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, role: UserRole, createAllergyDto: CreateAllergyDto) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: createAllergyDto.petId },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (role === 'USER' && pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para agregar alergias a esta mascota');
    }

    return this.prisma.allergy.create({
      data: createAllergyDto,
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

    return this.prisma.allergy.findMany({
      where: { petId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number, role: UserRole) {
    const allergy = await this.prisma.allergy.findUnique({
      where: { id },
      include: { pet: true },
    });

    if (!allergy) {
      throw new NotFoundException('Alergia no encontrada');
    }

    if (role === 'USER' && allergy.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para ver esta alergia');
    }

    return allergy;
  }

  async update(id: number, userId: number, role: UserRole, updateAllergyDto: UpdateAllergyDto) {
    const allergy = await this.prisma.allergy.findUnique({
      where: { id },
      include: { pet: true },
    });

    if (!allergy) {
      throw new NotFoundException('Alergia no encontrada');
    }

    if (role === 'USER' && allergy.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para actualizar esta alergia');
    }

    return this.prisma.allergy.update({
      where: { id },
      data: updateAllergyDto,
    });
  }

  async remove(id: number, userId: number, role: UserRole) {
    const allergy = await this.prisma.allergy.findUnique({
      where: { id },
      include: { pet: true },
    });

    if (!allergy) {
      throw new NotFoundException('Alergia no encontrada');
    }

    if (role === 'USER' && allergy.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes permisos para eliminar esta alergia');
    }

    return this.prisma.allergy.delete({
      where: { id },
    });
  }
}
