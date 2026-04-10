import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Put,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { SearchVeterinariansDto } from './dto/search-veterinarians.dto';
import { VerifyVeterinarianDto } from './dto/verify-veterinarian.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('veterinarians')
export class VeterinariansController {
  constructor(private readonly veterinariansService: VeterinariansService) {}

  /**
   * Crea un perfil de veterinario
   * POST /veterinarians
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createVeterinarianDto: CreateVeterinarianDto) {
    return this.veterinariansService.create(req.user.userId, createVeterinarianDto);
  }

  /**
   * Busca veterinarios
   * GET /veterinarians/search?country=Colombia&specialty=GENERAL
   */
  @Get('search')
  search(@Query() searchDto: SearchVeterinariansDto) {
    return this.veterinariansService.search(searchDto);
  }

  /**
   * Obtiene todos los veterinarios activos
   * GET /veterinarians
   */
  @Get()
  findAll() {
    return this.veterinariansService.search({});
  }

  /**
   * Obtiene un veterinario por ID
   * GET /veterinarians/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.veterinariansService.findOne(id);
  }

  /**
   * Obtiene el perfil del veterinario del usuario autenticado
   * GET /veterinarians/me/profile
   */
  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  findMyProfile(@Request() req) {
    return this.veterinariansService.findMyProfile(req.user.userId);
  }

  /**
   * Actualiza el perfil del veterinario
   * PATCH /veterinarians/me
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  update(@Request() req, @Body() updateVeterinarianDto: UpdateVeterinarianDto) {
    return this.veterinariansService.update(req.user.userId, updateVeterinarianDto);
  }

  /**
   * Actualiza el estado de disponibilidad del veterinario
   * PATCH /veterinarians/me/availability
   */
  @Patch('me/availability')
  @UseGuards(JwtAuthGuard)
  updateAvailability(@Request() req, @Body() updateDto: UpdateAvailabilityDto) {
    return this.veterinariansService.updateAvailability(req.user.userId, updateDto);
  }

  /**
   * ADMIN: Obtiene todos los veterinarios pendientes de verificación
   * GET /veterinarians/admin/pending
   */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findPending() {
    return this.veterinariansService.findPending();
  }

  /**
   * ADMIN: Verifica (aprueba o rechaza) un veterinario
   * PUT /veterinarians/admin/:id/verify
   */
  @Put('admin/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  verify(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() verifyDto: VerifyVeterinarianDto,
  ) {
    return this.veterinariansService.verify(
      id,
      req.user.userId,
      verifyDto.status,
      verifyDto.notes,
    );
  }
}
