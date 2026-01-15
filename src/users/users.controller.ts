import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Obtener perfil del usuario autenticado
   * GET /users/me
   * Headers: Authorization: Bearer <token>
   * Returns: { id, email, createdAt, updatedAt, pets: [...] }
   */
  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }
}

