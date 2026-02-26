import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WompiService } from './wompi.service';
import { OnboardVeterinarianDto } from './dto/onboard-veterinarian.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConsultationStatus, PaymentStatus, WompiAccountStatus } from '@prisma/client';
import { PlatformConfigService } from '../platform-config/platform-config.service';

@Injectable()
export class MarketplacePaymentsService {
  private readonly logger = new Logger(MarketplacePaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private wompiService: WompiService,
    private platformConfigService: PlatformConfigService,
  ) {}

  /**
   * Onboarding de veterinario en Wompi Marketplace
   */
  async onboardVeterinarian(veterinarianId: number, dto: OnboardVeterinarianDto) {
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { id: veterinarianId },
      include: { user: true },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    if (veterinarian.wompiSubaccountId) {
      throw new BadRequestException('El veterinario ya tiene una subcuenta en Wompi');
    }

    try {
      // Crear subcuenta en Wompi
      const subaccount = await this.wompiService.createSubaccount({
        email: veterinarian.user.email,
        legalName: dto.legalName,
        contactName: dto.contactName,
        phoneNumber: dto.phoneNumber,
        legalId: dto.legalId,
        accountType: dto.accountType || 'COLLECTION',
      });

      // Actualizar veterinario con datos de Wompi
      const updated = await this.prisma.veterinarian.update({
        where: { id: veterinarianId },
        data: {
          wompiSubaccountId: subaccount.data.id,
          wompiAccountStatus: WompiAccountStatus.PENDING,
        },
      });

      this.logger.log(`Veterinario ${veterinarianId} onboarded en Wompi: ${subaccount.data.id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error en onboarding: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear pago para una consulta
   */
  async createPayment(dto: CreatePaymentDto) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: dto.consultationId },
      include: {
        veterinarian: {
          include: { user: true },
        },
        user: true,
        payment: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    if (consultation.status !== ConsultationStatus.PENDING_PAYMENT) {
      throw new BadRequestException('La consulta no está pendiente de pago');
    }

    if (consultation.payment) {
      throw new BadRequestException('Ya existe un pago para esta consulta');
    }

    if (!consultation.veterinarian.wompiSubaccountId) {
      throw new BadRequestException('El veterinario no tiene una subcuenta configurada en Wompi');
    }

    // Calcular montos
    const amountInCents = Math.round(consultation.price * 100);
    const platformFeeInCents = Math.round(consultation.platformFee * 100);
    const veterinarianAmountInCents = Math.round(consultation.veterinarianAmount * 100);

    // Generar referencia única
    const reference = `CONSULT_${consultation.id}_${Date.now()}`;

    try {
      // Crear transacción en Wompi con split payment
      const transaction = await this.wompiService.createTransaction({
        amountInCents,
        currency: 'COP',
        customerEmail: consultation.user.email,
        reference,
        redirectUrl: dto.redirectUrl || `${process.env.FRONTEND_URL || 'http://localhost:8081'}/consultation/${consultation.id}/payment-callback`,
        split: {
          merchantId: consultation.veterinarian.wompiSubaccountId,
          amountInCents: veterinarianAmountInCents,
        },
      });

      // Crear registro de pago
      const payment = await this.prisma.payment.create({
        data: {
          consultationId: consultation.id,
          wompiTransactionId: transaction.data.id,
          wompiReference: reference,
          amount: consultation.price,
          platformFee: consultation.platformFee,
          veterinarianAmount: consultation.veterinarianAmount,
          status: PaymentStatus.PENDING,
          wompiResponse: JSON.stringify(transaction),
        },
      });

      this.logger.log(`Pago creado para consulta ${consultation.id}: ${reference}`);

      return {
        payment,
        checkoutUrl: transaction.data.checkout_url || transaction.data.permalink,
        transactionId: transaction.data.id,
      };
    } catch (error) {
      this.logger.error(`Error creando pago: ${error.message}`);
      throw error;
    }
  }

  /**
   * Procesar webhook de Wompi
   */
  async processWebhook(payload: any, signature: string) {
    // Validar firma
    const isValid = this.wompiService.validateWebhookSignature(payload, signature);
    if (!isValid) {
      this.logger.warn('Webhook con firma inválida');
      throw new BadRequestException('Firma inválida');
    }

    const event = payload.event;
    const data = payload.data;

    this.logger.log(`Webhook recibido: ${event} - Transaction: ${data.transaction?.id}`);

    // Buscar pago por transaction ID
    const payment = await this.prisma.payment.findFirst({
      where: { wompiTransactionId: data.transaction?.id },
      include: { consultation: true },
    });

    if (!payment) {
      this.logger.warn(`Pago no encontrado para transacción: ${data.transaction?.id}`);
      return;
    }

    // Actualizar estado según el evento
    if (event === 'transaction.updated') {
      const transactionStatus = data.transaction.status;

      let paymentStatus: PaymentStatus;
      let consultationStatus: ConsultationStatus;

      if (transactionStatus === 'APPROVED') {
        paymentStatus = PaymentStatus.APPROVED;
        consultationStatus = ConsultationStatus.PAID;
      } else if (transactionStatus === 'DECLINED' || transactionStatus === 'VOIDED') {
        paymentStatus = PaymentStatus.DECLINED;
        consultationStatus = ConsultationStatus.PENDING_PAYMENT;
      } else {
        paymentStatus = PaymentStatus.PENDING;
        consultationStatus = ConsultationStatus.PENDING_PAYMENT;
      }

      // Actualizar pago
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          wompiResponse: JSON.stringify(payload),
          updatedAt: new Date(),
        },
      });

      // Actualizar consulta
      await this.prisma.consultation.update({
        where: { id: payment.consultationId },
        data: {
          status: consultationStatus,
        },
      });

      this.logger.log(`Pago ${payment.id} actualizado: ${paymentStatus} - Consulta: ${consultationStatus}`);

      // Si el pago fue aprobado, emitir evento para WebSocket
      if (paymentStatus === PaymentStatus.APPROVED) {
        return {
          consultationId: payment.consultationId,
          status: 'paid',
        };
      }
    }

    return null;
  }

  /**
   * Calcular comisiones para una consulta
   * Usa el porcentaje configurado en la BD
   */
  async calculateFees(price: number): Promise<{ platformFee: number; veterinarianAmount: number }> {
    const platformFeePercentage = await this.platformConfigService.getCommissionPercentage();
    const platformFee = price * platformFeePercentage;
    const veterinarianAmount = price - platformFee;

    return {
      platformFee: Math.round(platformFee * 100) / 100,
      veterinarianAmount: Math.round(veterinarianAmount * 100) / 100,
    };
  }
}
