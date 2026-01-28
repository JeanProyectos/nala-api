import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { PetSex } from '@prisma/client';

export class CreatePetDto {
  @IsString()
  name: string;

  @IsString()
  type: string; // Perro, Gato, Loro, Conejo, Otros

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsEnum(PetSex)
  sex?: PetSex;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

