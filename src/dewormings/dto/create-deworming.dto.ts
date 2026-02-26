import { IsString, IsInt, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { DewormingType } from '@prisma/client';

export class CreateDewormingDto {
  @IsEnum(DewormingType)
  type: DewormingType;

  @IsString()
  product: string;

  @IsInt()
  petId: number;

  @IsDateString()
  appliedDate: string;

  @IsOptional()
  @IsDateString()
  nextDate?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
