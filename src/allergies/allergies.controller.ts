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
import { AllergiesService } from './allergies.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('allergies')
@UseGuards(JwtAuthGuard)
export class AllergiesController {
  constructor(private readonly allergiesService: AllergiesService) {}

  @Post()
  create(@Request() req, @Body() createAllergyDto: CreateAllergyDto) {
    return this.allergiesService.create(req.user.userId, req.user.role, createAllergyDto);
  }

  @Get('pet/:petId')
  findByPet(
    @Request() req,
    @Param('petId', ParseIntPipe) petId: number,
  ) {
    return this.allergiesService.findByPet(petId, req.user.userId, req.user.role);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.allergiesService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAllergyDto: UpdateAllergyDto,
  ) {
    return this.allergiesService.update(id, req.user.userId, req.user.role, updateAllergyDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.allergiesService.remove(id, req.user.userId, req.user.role);
  }
}
