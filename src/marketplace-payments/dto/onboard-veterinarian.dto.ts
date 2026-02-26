import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class OnboardVeterinarianDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  legalName: string; // Nombre legal o razón social

  @IsString()
  @IsNotEmpty()
  contactName: string; // Nombre de contacto

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  legalId: string; // Cédula o NIT

  @IsOptional()
  @IsString()
  accountType?: 'COLLECTION' | 'DISPERSION';
}
