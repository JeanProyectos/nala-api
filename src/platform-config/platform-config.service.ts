import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene la configuración actual de la plataforma
   * Si no existe, crea una con valores por defecto
   */
  async getConfig() {
    let config = await this.prisma.platformConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      // Crear configuración por defecto
      config = await this.prisma.platformConfig.create({
        data: {
          platformFeePercentage: 0.15, // 15% por defecto
        },
      });
    }

    return config;
  }

  /**
   * Actualiza la comisión de la plataforma
   */
  async updateCommission(percentage: number, adminId: number) {
    if (percentage < 0 || percentage > 1) {
      throw new Error('El porcentaje debe estar entre 0 y 1 (0% a 100%)');
    }

    // Obtener o crear configuración
    let config = await this.prisma.platformConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (config) {
      // Actualizar existente
      config = await this.prisma.platformConfig.update({
        where: { id: config.id },
        data: {
          platformFeePercentage: percentage,
          updatedBy: adminId,
        },
      });
    } else {
      // Crear nueva
      config = await this.prisma.platformConfig.create({
        data: {
          platformFeePercentage: percentage,
          updatedBy: adminId,
        },
      });
    }

    return config;
  }

  /**
   * Obtiene el porcentaje de comisión actual
   */
  async getCommissionPercentage(): Promise<number> {
    const config = await this.getConfig();
    return config.platformFeePercentage;
  }
}
