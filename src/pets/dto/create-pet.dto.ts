import { IsString, IsOptional, IsInt, IsNumber, Min } from 'class-validator';

export class CreatePetDto {
  @IsString()
  name: string;

  @IsString()
  species: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}

