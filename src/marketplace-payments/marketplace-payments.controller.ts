import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Headers,
} from '@nestjs/common';
import { MarketplacePaymentsService } from './marketplace-payments.service';
import { OnboardVeterinarianDto } from './dto/onboard-veterinarian.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('marketplace')
export class MarketplacePaymentsController {
  constructor(
    private readonly marketplaceService: MarketplacePaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('onboard-veterinarian')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VET)
  async onboardVeterinarian(@Request() req, @Body() dto: OnboardVeterinarianDto) {
    // Obtener ID del veterinario desde el usuario
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { userId: req.user.userId },
    });

    if (!veterinarian) {
      throw new Error('Veterinario no encontrado');
    }

    return this.marketplaceService.onboardVeterinarian(veterinarian.id, dto);
  }

  @Post('payments/create')
  @UseGuards(JwtAuthGuard)
  async createPayment(@Request() req, @Body() dto: CreatePaymentDto) {
    return this.marketplaceService.createPayment(dto);
  }

  @Post('payments/wompi/webhook')
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ) {
    // Log del webhook recibido
    console.log('Webhook recibido:', JSON.stringify(payload, null, 2));
    console.log('Signature:', signature);

    return this.marketplaceService.processWebhook(payload, signature || '');
  }
}
