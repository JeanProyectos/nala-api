import { IsOptional, IsString, IsEnum } from 'class-validator';
import { VeterinarianSpecialty } from '@prisma/client';

export class SearchVeterinariansDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(VeterinarianSpecialty)
  specialty?: VeterinarianSpecialty;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  search?: string; // Búsqueda por nombre
}
