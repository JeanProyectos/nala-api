import { PartialType } from '@nestjs/mapped-types';
import { CreateVeterinarianDto } from './create-veterinarian.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { VeterinarianStatus } from '@prisma/client';

export class UpdateVeterinarianDto extends PartialType(CreateVeterinarianDto) {
  @IsOptional()
  @IsEnum(VeterinarianStatus)
  status?: VeterinarianStatus;
}
