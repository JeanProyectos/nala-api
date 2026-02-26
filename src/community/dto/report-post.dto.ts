import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ReportPostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;
}
