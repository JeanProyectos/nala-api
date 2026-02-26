import { IsInt, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  consultationId: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string; // 'card', 'nequi', 'pse', etc.

  @IsString()
  @IsOptional()
  redirectUrl?: string; // URL de redirección después del pago
}
