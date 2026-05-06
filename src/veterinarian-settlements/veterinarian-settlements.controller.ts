import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VeterinarianSettlementsService } from './veterinarian-settlements.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { MarkSettlementPaidDto } from './dto/mark-settlement-paid.dto';

@Controller('veterinarian-settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VeterinarianSettlementsController {
  constructor(
    private readonly veterinarianSettlementsService: VeterinarianSettlementsService,
  ) {}

  @Get('me/dashboard')
  @Roles(UserRole.VET)
  getMyDashboard(@Request() req) {
    return this.veterinarianSettlementsService.getVeterinarianDashboard(
      req.user.userId,
    );
  }

  @Get('me')
  @Roles(UserRole.VET)
  getMySettlements(@Request() req) {
    return this.veterinarianSettlementsService.listVeterinarianSettlements(
      req.user.userId,
    );
  }

  @Get('me/payment-methods')
  @Roles(UserRole.VET)
  getMyPaymentMethods(@Request() req) {
    return this.veterinarianSettlementsService.listPaymentMethods(
      req.user.userId,
    );
  }

  @Post('me/payment-methods')
  @Roles(UserRole.VET)
  createPaymentMethod(@Request() req, @Body() dto: CreatePaymentMethodDto) {
    return this.veterinarianSettlementsService.createPaymentMethod(
      req.user.userId,
      dto,
    );
  }

  @Patch('me/payment-methods/:id')
  @Roles(UserRole.VET)
  updatePaymentMethod(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.veterinarianSettlementsService.updatePaymentMethod(
      req.user.userId,
      id,
      dto,
    );
  }

  @Patch('me/payment-methods/:id/activate')
  @Roles(UserRole.VET)
  activatePaymentMethod(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.veterinarianSettlementsService.activatePaymentMethod(
      req.user.userId,
      id,
    );
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  listPendingSettlements() {
    return this.veterinarianSettlementsService.listPendingSettlements();
  }

  @Post('admin/run-daily-close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  runDailyClose() {
    return this.veterinarianSettlementsService.generateDailySettlements();
  }

  @Patch('admin/:id/pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  markSettlementAsPaid(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarkSettlementPaidDto,
  ) {
    return this.veterinarianSettlementsService.markSettlementAsPaid(
      id,
      dto,
      req.user.userId,
    );
  }
}

@Controller('veterinarian/settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VET)
export class VeterinarianSettlementsVetController {
  constructor(
    private readonly veterinarianSettlementsService: VeterinarianSettlementsService,
  ) {}

  @Get('summary')
  getSummary(@Request() req) {
    return this.veterinarianSettlementsService.getVeterinarianDashboard(
      req.user.userId,
    );
  }

  @Get('history')
  getHistory(@Request() req) {
    return this.veterinarianSettlementsService.listVeterinarianSettlements(
      req.user.userId,
    );
  }
}

@Controller('admin/settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.FINANCE)
export class AdminSettlementsController {
  constructor(
    private readonly veterinarianSettlementsService: VeterinarianSettlementsService,
  ) {}

  @Get('pending')
  listPendingSettlements() {
    return this.veterinarianSettlementsService.listPendingSettlements();
  }

  @Post('run-daily-close')
  runDailyClose() {
    return this.veterinarianSettlementsService.generateDailySettlements();
  }

  @Post(':id/pay')
  markSettlementAsPaid(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarkSettlementPaidDto,
  ) {
    return this.veterinarianSettlementsService.markSettlementAsPaid(
      id,
      dto,
      req.user.userId,
    );
  }
}
