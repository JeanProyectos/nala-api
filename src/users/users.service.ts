import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene el perfil del usuario autenticado
   */
  async findProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        photo: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        pets: {
          where: { deletedAt: null }, // Usar deletedAt
          select: {
            id: true,
            name: true,
            species: true, // La BD usa 'species'
            breed: true,
            sex: true,
            birthDate: true,
            weight: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Actualiza el perfil del usuario autenticado
   */
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    // Verificar si el email ya está en uso por otro usuario
    if (updateProfileDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateProfileDto.email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new ForbiddenException('El email ya está en uso por otro usuario');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        photo: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Obtiene un usuario por ID (solo ADMIN puede ver otros usuarios)
   */
  async findOne(id: number, requesterRole: UserRole, requesterId: number) {
    // Solo ADMIN puede ver otros usuarios, los demás solo pueden verse a sí mismos
    if (requesterRole !== 'ADMIN' && id !== requesterId) {
      throw new ForbiddenException('No tienes permisos para ver este usuario');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        photo: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Obtiene todos los usuarios (solo ADMIN)
   */
  async findAll(requesterRole: UserRole) {
    if (requesterRole !== 'ADMIN') {
      throw new ForbiddenException('Solo los administradores pueden ver todos los usuarios');
    }

    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        photo: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene los permisos y menú según el rol del usuario
   */
  getPermissions(role: UserRole) {
    const permissions: Record<UserRole, { permissions: string[]; menu: any[] }> = {
      USER: {
        permissions: ['pets:read', 'pets:write', 'pets:delete', 'vaccines:read', 'vaccines:write'],
        menu: [
          { id: 'index', label: 'Inicio', path: '/index', icon: '🏠' },
          { id: 'chat', label: 'Chat', path: '/chat', icon: '💬' },
          { id: 'pets', label: 'Mis Mascotas', path: '/mascota', icon: '🐾' },
          { id: 'veterinarians', label: 'Veterinarios', path: '/veterinarios', icon: '👨‍⚕️' },
          { id: 'health', label: 'Historial de Salud', path: '/salud', icon: '💊' },
          { id: 'reminders', label: 'Recordatorios', path: '/recordatorios', icon: '🔔' },
          { id: 'profile', label: 'Mi Perfil', path: '/perfil', icon: '👤' },
        ],
      },
      VET: {
        permissions: [
          'pets:read',
          'vaccines:read',
          'vaccines:write',
          'appointments:read',
          'appointments:write',
          'consultations:read',
          'consultations:write',
        ],
        menu: [
          { id: 'index', label: 'Inicio', path: '/index', icon: '🏠' },
          { id: 'chat', label: 'Chat', path: '/chat', icon: '💬' },
          { id: 'pacientes', label: 'Mis Pacientes', path: '/pacientes', icon: '👥' },
          { id: 'mascota', label: 'Mis Mascotas', path: '/mascota', icon: '🐾' },
          { id: 'health', label: 'Historial de Salud', path: '/salud', icon: '💊' },
          { id: 'reminders', label: 'Recordatorios', path: '/recordatorios', icon: '🔔' },
          { id: 'profile', label: 'Mi Perfil', path: '/perfil', icon: '👤' },
        ],
      },
      ADMIN: {
        permissions: [
          'users:read',
          'users:write',
          'pets:read',
          'pets:write',
          'pets:delete',
          'vaccines:read',
          'vaccines:write',
          'vets:read',
          'vets:write',
          'reports:read',
        ],
        menu: [
          { id: 'index', label: 'Inicio', path: '/index', icon: '🏠' },
          { id: 'all-pets', label: 'Todas las Mascotas', path: '/mascota', icon: '🐾' },
          { id: 'health', label: 'Historial de Salud', path: '/salud', icon: '💊' },
          { id: 'reminders', label: 'Recordatorios', path: '/recordatorios', icon: '🔔' },
          { id: 'profile', label: 'Mi Perfil', path: '/perfil', icon: '👤' },
        ],
      },
    };

    return {
      role,
      ...permissions[role],
    };
  }

  /**
   * Registra o actualiza el token de notificaciones push del usuario
   */
  async registerPushToken(userId: number, expoPushToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken },
      select: {
        id: true,
        name: true,
        email: true,
        expoPushToken: true,
      },
    });
  }
}
