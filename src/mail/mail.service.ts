import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP configurado (${host}:${port})`);
    } else {
      this.logger.warn(
        'SMTP no configurado (SMTP_HOST, SMTP_USER, SMTP_PASS). Los códigos OTP solo se registrarán en log.',
      );
    }
  }

  async sendMail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@nala.app';

    if (!this.transporter) {
      this.logger.warn(`[OTP / mail omitido] Para: ${to} | Asunto: ${subject}\n${text}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"NALA" <${from}>`,
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br/>'),
      });
      return true;
    } catch (e) {
      this.logger.error(`Error enviando correo a ${to}:`, (e as Error)?.message || e);
      return false;
    }
  }
}
