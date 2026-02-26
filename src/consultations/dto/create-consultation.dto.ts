import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ConsultationType } from '@prisma/client';

export class CreateConsultationDto {
  @IsEnum(ConsultationType)
  type: ConsultationType;

  @IsNumber()
  veterinarianId: number;

  @IsOptional()
  @IsNumber()
  petId?: number;
}
