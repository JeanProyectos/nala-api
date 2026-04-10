import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

/** Body de POST /diagnostics/videocall-log (app móvil + futuros clientes). */
export class VideoCallLogDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  consultationId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500000)
  logText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sentAt?: string;

  /** Enviado por la app al volcar el log local (leaveCall, unmount, etc.). */
  @IsOptional()
  @IsString()
  @MaxLength(256)
  reason?: string;
}
