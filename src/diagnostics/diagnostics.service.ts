import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { basename, join } from 'path';

export interface VideoCallLogPayload {
  consultationId?: number;
  logText?: string;
  platform?: string;
  appVersion?: string;
  sentAt?: string;
  reason?: string;
}

@Injectable()
export class DiagnosticsService implements OnModuleInit {
  private readonly logger = new Logger(DiagnosticsService.name);

  /** Directorio ya resuelto (evita mkdir en cada línea de log). */
  private resolvedLogDir: string | null = null;

  /**
   * Raíz del proyecto (carpeta con package.json), aunque process.cwd() sea otra
   * (p. ej. IIS ejecutando desde inetpub mientras el código vive en otro disco).
   */
  private getProjectRoot(): string {
    const twoUp = join(__dirname, '..', '..');
    return basename(twoUp) === 'dist' ? join(twoUp, '..') : twoUp;
  }

  private getLogDirCandidates(): string[] {
    const envDir =
      (process.env.VIDEOCALL_LOG_DIR || process.env.NALA_VIDEOCALL_LOG_DIR || '').trim();
    if (envDir) {
      return [envDir];
    }

    const projectRoot = this.getProjectRoot();
    const cwd = process.cwd();

    return [
      join(projectRoot, 'logs', 'videocall'),
      join(cwd, 'logs', 'videocall'),
      'C:\\inetpub\\wwwroot\\nala-api\\logs\\videocall',
      // Último recurso: casi siempre escribible (IIS a veces no deja crear carpetas bajo wwwroot)
      join(tmpdir(), 'nala-api-videocall'),
    ];
  }

  async onModuleInit() {
    try {
      const dir = await this.resolveWritableLogDir();
      const stampPath = join(dir, '_api-startup.txt');
      await fs.appendFile(
        stampPath,
        `${new Date().toISOString()} pid=${process.pid} cwd=${process.cwd()} projectRoot=${this.getProjectRoot()}\n`,
        'utf8',
      );
      this.logger.log(`Videocall logs OK — prueba: ${stampPath}`);
    } catch (e) {
      const msg = `No se pudo preparar logs/videocall: ${String((e as Error)?.message || e)}`;
      this.logger.error(msg);
      console.error(`[DiagnosticsService] ${msg}`);
    }
  }

  private async resolveWritableLogDir(): Promise<string> {
    if (this.resolvedLogDir) {
      return this.resolvedLogDir;
    }

    const candidates = this.getLogDirCandidates();
    for (const dir of candidates) {
      try {
        await fs.mkdir(dir, { recursive: true });
        this.resolvedLogDir = dir;
        this.logger.log(`Videocall logs → ${dir} (cwd=${process.cwd()}, projectRoot=${this.getProjectRoot()})`);
        return dir;
      } catch (error) {
        this.logger.warn(`No se pudo usar directorio de logs ${dir}: ${String(error?.message || error)}`);
      }
    }

    throw new Error('No writable log directory available for videocall logs');
  }

  /**
   * Un solo archivo por consulta: consultation-<id>.txt
   * Eventos sin id de sala (p. ej. socket conectado) van a consultation-global.txt
   */
  private consultationLogBasename(consultationId: number | undefined): string {
    const n = Number(consultationId);
    if (Number.isFinite(n) && n > 0) {
      return String(n);
    }
    return 'global';
  }

  async saveVideoCallLog(payload: VideoCallLogPayload) {
    const now = new Date();
    const safeConsultationId = Number.isFinite(Number(payload?.consultationId))
      ? Number(payload.consultationId)
      : 0;

    const logDir = await this.resolveWritableLogDir();

    const base = safeConsultationId > 0 ? String(safeConsultationId) : 'unknown';
    const filename = `consultation-${base}.txt`;
    const filePath = join(logDir, filename);

    const header = [
      '',
      '==================================================',
      '[CLIENT] Volcado desde la app',
      `receivedAt: ${now.toISOString()}`,
      `sentAt: ${payload?.sentAt || 'n/a'}`,
      `consultationId: ${safeConsultationId || 'n/a'}`,
      `platform: ${payload?.platform || 'n/a'}`,
      `appVersion: ${payload?.appVersion || 'n/a'}`,
      `reason: ${payload?.reason || 'n/a'}`,
      '--------------------------------------------------',
    ].join('\n');

    const body = `${payload?.logText || '[empty log]'}`.trimEnd();
    const chunk = `${header}\n${body}\n`;

    await fs.appendFile(filePath, chunk, { encoding: 'utf8' });

    return {
      filePath,
      filename,
    };
  }

  async logVideoCallEvent(
    consultationId: number | undefined,
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    message: string,
    payload?: unknown,
  ) {
    try {
      const logDir = await this.resolveWritableLogDir();
      const filePath = join(logDir, `consultation-${this.consultationLogBasename(consultationId)}.txt`);
      const ts = new Date().toISOString();
      const line = `[${ts}] [SERVER] [${level}] ${message}${payload !== undefined ? ` | ${JSON.stringify(payload)}` : ''}\n`;
      await fs.appendFile(filePath, line, { encoding: 'utf8' });
    } catch (error) {
      const msg = `No se pudo escribir server log de videollamada: ${String(error?.message || error)}`;
      this.logger.error(msg);
      console.error(`[DiagnosticsService] ${msg}`);
    }
  }
}

