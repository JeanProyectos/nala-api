import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { PlatformConfigService } from './platform-config.service';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/platform-config')
export class PlatformConfigController {
  constructor(private readonly configService: PlatformConfigService) {}

  /**
   * Obtiene la configuración actual (solo admin)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getConfig() {
    return this.configService.getConfig();
  }

  /**
   * Actualiza la comisión de la plataforma (solo admin)
   */
  @Put('commission')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateCommission(@Request() req, @Body() dto: UpdateCommissionDto) {
    return this.configService.updateCommission(dto.percentage, req.user.userId);
  }
}
