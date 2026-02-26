import { IsNumber, Min, Max } from 'class-validator';

export class UpdateCommissionDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  percentage: number; // 0.15 = 15%, 0.20 = 20%, etc.
}
