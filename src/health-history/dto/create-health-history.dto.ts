import { IsString, IsInt, IsDateString, IsOptional } from 'class-validator';

export class CreateHealthHistoryDto {
  @IsInt()
  petId: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  treatment?: string;

  @IsOptional()
  @IsString()
  medications?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  veterinarian?: string;
}
