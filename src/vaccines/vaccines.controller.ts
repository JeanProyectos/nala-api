import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { VaccinesService } from './vaccines.service';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { UpdateVaccineDto } from './dto/update-vaccine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vaccines')
@UseGuards(JwtAuthGuard)
export class VaccinesController {
  constructor(private readonly vaccinesService: VaccinesService) {}

  /**
   * Crear una nueva vacuna
   * POST /vaccines
   */
  @Post()
  create(@Request() req, @Body() createVaccineDto: CreateVaccineDto) {
    return this.vaccinesService.create(req.user.userId, req.user.role, createVaccineDto);
  }

  /**
   * Obtener todas las vacunas de una mascota
   * GET /vaccines/pet/:petId
   */
  @Get('pet/:petId')
  findByPet(
    @Request() req,
    @Param('petId', ParseIntPipe) petId: number,
  ) {
    return this.vaccinesService.findByPet(petId, req.user.userId, req.user.role);
  }

  /**
   * Obtener una vacuna por ID
   * GET /vaccines/:id
   */
  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.vaccinesService.findOne(id, req.user.userId, req.user.role);
  }

  /**
   * Actualizar una vacuna
   * PATCH /vaccines/:id
   */
  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVaccineDto: UpdateVaccineDto,
  ) {
    return this.vaccinesService.update(id, req.user.userId, req.user.role, updateVaccineDto);
  }

  /**
   * Eliminar una vacuna
   * DELETE /vaccines/:id
   */
  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.vaccinesService.remove(id, req.user.userId, req.user.role);
  }
}
