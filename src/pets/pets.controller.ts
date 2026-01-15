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
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  /**
   * Crear una nueva mascota
   * POST /pets
   * Headers: Authorization: Bearer <token>
   * Body: { name: string, species: string, age?: number, weight?: number }
   */
  @Post()
  create(@Request() req, @Body() createPetDto: CreatePetDto) {
    return this.petsService.create(req.user.userId, createPetDto);
  }

  /**
   * Obtener todas las mascotas del usuario
   * GET /pets
   * Headers: Authorization: Bearer <token>
   */
  @Get()
  findAll(@Request() req) {
    return this.petsService.findAll(req.user.userId);
  }

  /**
   * Obtener una mascota por ID
   * GET /pets/:id
   * Headers: Authorization: Bearer <token>
   */
  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.petsService.findOne(id, req.user.userId);
  }

  /**
   * Actualizar una mascota
   * PATCH /pets/:id
   * Headers: Authorization: Bearer <token>
   * Body: { name?: string, species?: string, age?: number, weight?: number }
   */
  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePetDto: UpdatePetDto,
  ) {
    return this.petsService.update(id, req.user.userId, updatePetDto);
  }

  /**
   * Eliminar una mascota
   * DELETE /pets/:id
   * Headers: Authorization: Bearer <token>
   */
  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.petsService.remove(id, req.user.userId);
  }
}

