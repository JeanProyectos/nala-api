import { IsEnum, IsOptional, IsInt, Min, Max, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PostType, PostVisibility } from '@prisma/client';

export class QueryPostsDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsEnum(PostType)
  @IsOptional()
  type?: PostType;

  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  search?: string; // Búsqueda por título
}
