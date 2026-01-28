import { IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateVaccineDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  appliedDate?: string;

  @IsOptional()
  @IsDateString()
  nextDose?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
