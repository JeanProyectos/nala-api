import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VeterinarianStatus } from '@prisma/client';

export class VerifyVeterinarianDto {
  @IsEnum(VeterinarianStatus)
  status: VeterinarianStatus; // VERIFIED o REJECTED

  @IsOptional()
  @IsString()
  notes?: string; // Notas del admin (opcional, útil para rechazos)
}
