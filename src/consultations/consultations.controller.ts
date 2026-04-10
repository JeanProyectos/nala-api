import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Patch,
  ForbiddenException,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { RateConsultationDto } from './dto/rate-consultation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(
    private readonly consultationsService: ConsultationsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Crea una nueva consulta
   * POST /consultations
   */
  @Post()
  create(@Request() req, @Body() createConsultationDto: CreateConsultationDto) {
    return this.consultationsService.create(req.user.userId, createConsultationDto);
  }

  /**
   * Obtiene las consultas del usuario
   * GET /consultations
   * Si es veterinario, devuelve sus consultas como veterinario
   * Si es usuario normal, devuelve sus consultas como cliente
   */
  @Get()
  async findByUser(@Request() req) {
    // Verificar si es veterinario
    const vet = await this.prisma.veterinarian.findUnique({
      where: { userId: req.user.userId },
    });

    if (vet) {
      // Si es veterinario, devolver sus consultas como veterinario
      return this.consultationsService.findByVeterinarian(vet.id);
    } else {
      // Si es usuario normal, devolver sus consultas como cliente
      return this.consultationsService.findByUser(req.user.userId);
    }
  }

  /**
   * Obtiene una consulta por ID
   * GET /consultations/:id
   */
  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.consultationsService.findOne(id, req.user.userId);
  }

  /**
   * Acepta una consulta (solo veterinario)
   * PATCH /consultations/:id/accept
   */
  @Patch(':id/accept')
  async accept(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const vet = await this.prisma.veterinarian.findUnique({
      where: { userId: req.user.userId },
    });

    if (!vet) {
      throw new ForbiddenException('Solo los veterinarios pueden aceptar consultas');
    }

    return this.consultationsService.accept(id, vet.id);
  }

  /**
   * Rechaza una consulta (solo veterinario)
   * PATCH /consultations/:id/reject
   */
  @Patch(':id/reject')
  async reject(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const vet = await this.prisma.veterinarian.findUnique({
      where: { userId: req.user.userId },
    });

    if (!vet) {
      throw new ForbiddenException('Solo los veterinarios pueden rechazar consultas');
    }

    return this.consultationsService.reject(id, vet.id);
  }

  /**
   * Inicia una consulta
   * PATCH /consultations/:id/start
   */
  @Patch(':id/start')
  start(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { isVet?: boolean },
  ) {
    return this.consultationsService.start(id, req.user.userId, body.isVet || false);
  }

  /**
   * Finaliza una consulta
   * PATCH /consultations/:id/finish
   */
  @Patch(':id/finish')
  finish(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { isVet?: boolean; reason?: string },
  ) {
    return this.consultationsService.finish(id, req.user.userId, body.isVet || false, body.reason);
  }

  /**
   * Califica una consulta
   * POST /consultations/:id/rate
   */
  @Post(':id/rate')
  rate(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() rateDto: RateConsultationDto,
  ) {
    return this.consultationsService.rate(id, req.user.userId, rateDto);
  }
}
