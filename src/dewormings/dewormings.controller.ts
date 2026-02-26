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
import { DewormingsService } from './dewormings.service';
import { CreateDewormingDto } from './dto/create-deworming.dto';
import { UpdateDewormingDto } from './dto/update-deworming.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dewormings')
@UseGuards(JwtAuthGuard)
export class DewormingsController {
  constructor(private readonly dewormingsService: DewormingsService) {}

  @Post()
  create(@Request() req, @Body() createDewormingDto: CreateDewormingDto) {
    return this.dewormingsService.create(req.user.userId, req.user.role, createDewormingDto);
  }

  @Get('pet/:petId')
  findByPet(
    @Request() req,
    @Param('petId', ParseIntPipe) petId: number,
  ) {
    return this.dewormingsService.findByPet(petId, req.user.userId, req.user.role);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.dewormingsService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDewormingDto: UpdateDewormingDto,
  ) {
    return this.dewormingsService.update(id, req.user.userId, req.user.role, updateDewormingDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.dewormingsService.remove(id, req.user.userId, req.user.role);
  }
}
