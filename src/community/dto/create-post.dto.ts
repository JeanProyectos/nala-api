import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  ValidateIf,
  Min,
  Max,
} from 'class-validator';
import { PostType, PostVisibility, PetSpecies } from '@prisma/client';

export class CreatePostDto {
  @IsEnum(PostType)
  @IsNotEmpty()
  type: PostType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility = PostVisibility.PUBLIC;

  @IsBoolean()
  @ValidateIf((o) => o.type === 'CLINICAL_CASE')
  @IsNotEmpty()
  declaresNoPersonalData?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];

  // Clinical Case specific fields
  @ValidateIf((o) => o.type === 'CLINICAL_CASE')
  @IsEnum(PetSpecies)
  @IsNotEmpty()
  species?: PetSpecies;

  @ValidateIf((o) => o.type === 'CLINICAL_CASE')
  @IsString()
  @IsOptional()
  age?: string;

  @ValidateIf((o) => o.type === 'CLINICAL_CASE')
  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

  @ValidateIf((o) => o.type === 'CLINICAL_CASE')
  @IsString()
  @IsNotEmpty()
  symptoms?: string;

  @ValidateIf((o) => o.type === 'CLINICAL_CASE')
  @IsString()
  @IsNotEmpty()
  diagnosis?: string;

  @ValidateIf((o) => o.type === 'CLINICAL_CASE')
  @IsString()
  @IsNotEmpty()
  treatment?: string;

  @ValidateIf((o) => o.type === 'CLINICAL_CASE')
  @IsString()
  @IsOptional()
  evolution?: string;

  @ValidateIf((o) => o.type === 'CLINICAL_CASE')
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  // Forum Discussion specific fields
  @ValidateIf((o) => o.type === 'FORUM_DISCUSSION')
  @IsString()
  @IsNotEmpty()
  description?: string;

  // Article specific fields
  @ValidateIf((o) => o.type === 'ARTICLE')
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ValidateIf((o) => o.type === 'ARTICLE')
  @IsString()
  @IsOptional()
  coverImage?: string;
}
