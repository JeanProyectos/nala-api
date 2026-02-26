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
import { HealthHistoryService } from './health-history.service';
import { CreateHealthHistoryDto } from './dto/create-health-history.dto';
import { UpdateHealthHistoryDto } from './dto/update-health-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('health-history')
@UseGuards(JwtAuthGuard)
export class HealthHistoryController {
  constructor(private readonly healthHistoryService: HealthHistoryService) {}

  @Post()
  create(@Request() req, @Body() createHealthHistoryDto: CreateHealthHistoryDto) {
    return this.healthHistoryService.create(req.user.userId, req.user.role, createHealthHistoryDto);
  }

  @Get('pet/:petId')
  findByPet(
    @Request() req,
    @Param('petId', ParseIntPipe) petId: number,
  ) {
    return this.healthHistoryService.findByPet(petId, req.user.userId, req.user.role);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.healthHistoryService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHealthHistoryDto: UpdateHealthHistoryDto,
  ) {
    return this.healthHistoryService.update(id, req.user.userId, req.user.role, updateHealthHistoryDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.healthHistoryService.remove(id, req.user.userId, req.user.role);
  }
}
