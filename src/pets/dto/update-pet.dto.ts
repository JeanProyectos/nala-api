import { IsString, IsOptional, IsInt, IsNumber, Min } from 'class-validator';

export class UpdatePetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}

