import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VetOnlyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user is a veterinarian
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { userId: user.userId },
    });

    if (!veterinarian || veterinarian.status !== 'VERIFIED') {
      throw new ForbiddenException('Only verified veterinarians can access this resource');
    }

    // Attach veterinarian info to request
    request.veterinarian = veterinarian;
    return true;
  }
}
