import { Controller, Get, Patch, Body, UseGuards, Request, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Obtener perfil del usuario autenticado
   * GET /users/me
   * Headers: Authorization: Bearer <token>
   */
  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.findProfile(req.user.userId);
  }

  /**
   * Actualizar perfil del usuario autenticado
   * PATCH /users/me
   * Headers: Authorization: Bearer <token>
   * Body: { name?, email?, phone? }
   */
  @Patch('me')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  /**
   * Obtener todos los usuarios (solo ADMIN)
   * GET /users
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async findAll(@Request() req) {
    return this.usersService.findAll(req.user.role);
  }

  /**
   * Obtener permisos y menú según el rol
   * GET /users/permissions
   */
  @Get('permissions')
  getPermissions(@Request() req) {
    return this.usersService.getPermissions(req.user.role);
  }

  /**
   * Obtener un usuario por ID (solo ADMIN o el propio usuario)
   * GET /users/:id
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.usersService.findOne(
      parseInt(id),
      req.user.role,
      req.user.userId,
    );
  }
}

