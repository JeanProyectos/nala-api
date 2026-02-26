import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReminderStatus } from '@prisma/client';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  /**
   * Obtiene los recordatorios del usuario autenticado
   * GET /reminders?status=PENDING
   */
  @Get()
  findAll(@Request() req, @Query('status') status?: ReminderStatus) {
    return this.remindersService.findByUser(req.user.userId, status);
  }

  /**
   * Actualiza un recordatorio (marcar como completado, posponer, etc.)
   * PATCH /reminders/:id
   */
  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReminderDto: UpdateReminderDto,
  ) {
    return this.remindersService.update(id, req.user.userId, updateReminderDto);
  }

  /**
   * Elimina un recordatorio
   * DELETE /reminders/:id
   */
  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.remindersService.remove(id, req.user.userId);
  }

  /**
   * Genera recordatorios de prueba (solo desarrollo)
   * POST /reminders/test
   */
  @Post('test')
  generateTest(@Request() req) {
    return this.remindersService.generateTestReminders(req.user.userId);
  }
}
