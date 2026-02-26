import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ReminderStatus } from '@prisma/client';

export class UpdateReminderDto {
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @IsOptional()
  @IsDateString()
  postponedTo?: string;
}
