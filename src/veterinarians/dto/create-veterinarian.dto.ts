import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { VeterinarianSpecialty } from '@prisma/client';

export class CreateVeterinarianDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsEnum(VeterinarianSpecialty)
  specialty: VeterinarianSpecialty;

  @IsNumber()
  @Min(0)
  yearsExperience: number;

  @IsOptional()
  @IsString()
  professionalDescription?: string;

  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceChat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceVoice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceVideo?: number;

  // Mantener para compatibilidad con datos antiguos
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerConsultation?: number;
}
