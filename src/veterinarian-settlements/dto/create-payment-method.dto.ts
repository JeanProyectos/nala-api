import { IsBoolean, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { VeterinarianPaymentMethodType } from '@prisma/client';

export class CreatePaymentMethodDto {
  @IsEnum(VeterinarianPaymentMethodType)
  type: VeterinarianPaymentMethodType;

  @IsOptional()
  @IsString()
  label?: string;

  @ValidateIf((o) => o.type === VeterinarianPaymentMethodType.BANK_ACCOUNT)
  @IsString()
  bank?: string;

  @ValidateIf((o) => o.type === VeterinarianPaymentMethodType.BANK_ACCOUNT)
  @IsString()
  accountType?: string;

  @ValidateIf((o) => o.type === VeterinarianPaymentMethodType.BANK_ACCOUNT)
  @IsString()
  accountNumber?: string;

  @ValidateIf((o) => o.type === VeterinarianPaymentMethodType.MOBILE_WALLET)
  @IsString()
  walletProvider?: string;

  @ValidateIf((o) => o.type === VeterinarianPaymentMethodType.MOBILE_WALLET)
  @IsString()
  walletNumber?: string;

  @IsString()
  accountHolderName: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
