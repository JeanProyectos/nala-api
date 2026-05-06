import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

const RESET_CODE_TTL_MS = 10 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  /**
   * Registra un nuevo usuario
   * POST /auth/register
   */
  async register(registerDto: RegisterDto) {
    const { name, email, password, phone, role } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario (rol por defecto USER). Roles operativos se asignan fuera del registro publico.
    const userRole = role === 'VET' ? 'VET' : 'USER';
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: userRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        photo: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generar JWT con rol
    const token = this.jwtService.sign({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
    });

    return {
      user,
      token,
    };
  }

  /**
   * Inicia sesión de un usuario
   * POST /auth/login
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tu cuenta está inactiva. Contacta al administrador');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar JWT con rol
    const token = this.jwtService.sign({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo,
        role: user.role,
        isActive: user.isActive,
      },
      token,
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  /**
   * Solicita código OTP por correo (no revela si el email existe).
   */
  async requestPasswordReset(emailRaw: string) {
    const generic = {
      message:
        'Si el correo está registrado en NALA, recibirás un código de 6 dígitos en los próximos minutos.',
    };

    const emailNorm = this.normalizeEmail(emailRaw);
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: emailNorm, mode: 'insensitive' } },
    });
    if (!user) {
      return generic;
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);

    const emailKey = this.normalizeEmail(user.email);
    await this.prisma.passwordResetOtp.deleteMany({ where: { email: emailKey } });
    await this.prisma.passwordResetOtp.create({
      data: {
        email: emailKey,
        codeHash,
        expiresAt,
        attempts: 0,
      },
    });

    await this.mailService.sendMail(
      user.email,
      'NALA — recuperación de contraseña',
      `Tu código de verificación es: ${code}\n\nVence en 10 minutos. Si no solicitaste este cambio, ignora este mensaje.`,
    );

    return generic;
  }

  private async getActiveOtp(email: string) {
    const normalized = this.normalizeEmail(email);
    return this.prisma.passwordResetOtp.findFirst({
      where: { email: normalized },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyPasswordResetCode(emailRaw: string, code: string) {
    const email = this.normalizeEmail(emailRaw);
    const row = await this.getActiveOtp(email);
    if (!row) {
      throw new BadRequestException('No hay solicitud de recuperación activa para este correo.');
    }
    if (row.expiresAt.getTime() < Date.now()) {
      await this.prisma.passwordResetOtp.delete({ where: { id: row.id } });
      throw new BadRequestException('El código expiró. Solicita uno nuevo.');
    }
    if (row.attempts >= RESET_MAX_ATTEMPTS) {
      throw new HttpException(
        'Demasiados intentos fallidos. Solicita un código nuevo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const ok = await bcrypt.compare(code.trim(), row.codeHash);
    if (!ok) {
      await this.prisma.passwordResetOtp.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Código incorrecto.');
    }

    return { valid: true };
  }

  async resetPasswordWithCode(emailRaw: string, code: string, newPassword: string) {
    await this.verifyPasswordResetCode(emailRaw, code);

    const email = this.normalizeEmail(emailRaw);
    const row = await this.getActiveOtp(email);
    if (!row) {
      throw new BadRequestException('Código ya no válido.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado.');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    await this.prisma.passwordResetOtp.delete({ where: { id: row.id } });

    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }
}

