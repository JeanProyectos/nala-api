import { IsString, IsInt, IsDateString, IsOptional } from 'class-validator';

export class CreateVaccineDto {
  @IsString()
  name: string;

  @IsInt()
  petId: number;

  @IsDateString()
  appliedDate: string;

  @IsOptional()
  @IsDateString()
  nextDose?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
