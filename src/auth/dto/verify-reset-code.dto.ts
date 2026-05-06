import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class VerifyResetCodeDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
