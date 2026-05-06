import { IsInt, IsOptional, IsString } from 'class-validator';

export class MarkSettlementPaidDto {
  @IsOptional()
  @IsInt()
  paymentMethodId?: number;

  @IsOptional()
  @IsString()
  paymentMethodUsed?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
