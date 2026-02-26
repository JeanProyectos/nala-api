import { IsString, IsInt, IsEnum } from 'class-validator';
import { AllergyType, SeverityLevel } from '@prisma/client';

export class CreateAllergyDto {
  @IsEnum(AllergyType)
  type: AllergyType;

  @IsString()
  description: string;

  @IsEnum(SeverityLevel)
  severity: SeverityLevel;

  @IsInt()
  petId: number;
}
