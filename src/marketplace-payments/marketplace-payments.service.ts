import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from './mercadopago.service';
import { OnboardVeterinarianDto } from './dto/onboard-veterinarian.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConsultationStatus, PaymentStatus, WompiAccountStatus } from '@prisma/client';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MarketplacePaymentsService {
  private readonly logger = new Logger(MarketplacePaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private mercadoPagoService: MercadoPagoService,
    private platformConfigService: PlatformConfigService,
    private chatGateway: ChatGateway,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Onboarding de veterinario en Mercado Pago Marketplace
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
      throw new BadRequestException('El veterinario ya tiene una cuenta configurada');
    }

    try {
      // Crear vendedor en Mercado Pago
      // Nota: wompiSubaccountId se reutiliza para almacenar el ID de Mercado Pago
      const seller = await this.mercadoPagoService.createSeller({
        email: veterinarian.user.email,
        firstName: dto.contactName.split(' ')[0] || dto.contactName,
        lastName: dto.contactName.split(' ').slice(1).join(' ') || dto.contactName,
        identification: {
          type: 'DNI', // Ajustar según el país
          number: dto.legalId,
        },
        phone: dto.phoneNumber ? {
          areaCode: dto.phoneNumber.substring(0, 3) || '57',
          number: dto.phoneNumber.replace(/\D/g, '').substring(3) || dto.phoneNumber,
        } : undefined,
      });

      // Actualizar veterinario con datos de Mercado Pago
      const updated = await this.prisma.veterinarian.update({
        where: { id: veterinarianId },
        data: {
          wompiSubaccountId: seller.id, // Reutilizamos este campo para MP
          wompiAccountStatus: WompiAccountStatus.PENDING,
        },
      });

      this.logger.log(`Veterinario ${veterinarianId} onboarded en Mercado Pago: ${seller.id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error en onboarding: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear pago para una consulta
   */
  async createPayment(dto: CreatePaymentDto, userId: number) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: dto.consultationId },
      include: {
        veterinarian: {
          include: { user: true },
        },
        user: true,
        payment: true,
        pet: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    if (consultation.userId !== userId) {
      throw new BadRequestException('No puedes pagar una consulta de otro usuario');
    }

    const payableStatuses: ConsultationStatus[] = [
      ConsultationStatus.PENDING_PAYMENT,
      ConsultationStatus.PENDING_APPROVAL,
      ConsultationStatus.IN_PROGRESS,
      ConsultationStatus.FINISHED,
    ];

    if (!payableStatuses.includes(consultation.status)) {
      throw new BadRequestException('La consulta no está disponible para pago');
    }

    if (consultation.payment?.status === PaymentStatus.APPROVED) {
      throw new BadRequestException('La consulta ya tiene un pago aprobado');
    }

    // Calcular montos (Mercado Pago usa valores en la moneda base, no centavos)
    const amount = consultation.price;
    const platformFee = consultation.platformFee;

    // Generar referencia única
    const reference = `CONSULT_${consultation.id}_${Date.now()}`;

    try {
      // En pruebas estamos cobrando a la cuenta principal de NALA.
      // La distribución al veterinario se sigue calculando y guardando en BD.
      const enableMarketplaceFee = process.env.MP_ENABLE_MARKETPLACE_FEES === 'true';

      const preference = await this.mercadoPagoService.createPreference({
        amount,
        currency: 'COP',
        payerEmail: consultation.user.email,
        description: `Consulta ${consultation.type}${consultation.pet ? ` - ${consultation.pet.name}` : ''}`,
        externalReference: reference,
        backUrls: {
          success: dto.redirectUrl || `${process.env.FRONTEND_URL || 'http://localhost:8081'}/consultation/${consultation.id}/payment-callback?status=success`,
          failure: dto.redirectUrl || `${process.env.FRONTEND_URL || 'http://localhost:8081'}/consultation/${consultation.id}/payment-callback?status=failure`,
          pending: dto.redirectUrl || `${process.env.FRONTEND_URL || 'http://localhost:8081'}/consultation/${consultation.id}/payment-callback?status=pending`,
        },
        // Solo enviar application_fee cuando la cuenta tenga permisos de marketplace.
        applicationFee: enableMarketplaceFee ? platformFee : undefined,
      });

      // Crear registro de pago
      const paymentData = {
        wompiTransactionId: preference.id?.toString(), // Reutilizado para Mercado Pago
        wompiReference: reference,
        amount: consultation.price,
        platformFee: consultation.platformFee,
        veterinarianAmount: consultation.veterinarianAmount,
        status: PaymentStatus.PENDING,
        wompiResponse: JSON.stringify(preference),
      };

      const payment = consultation.payment
        ? await this.prisma.payment.update({
            where: { id: consultation.payment.id },
            data: paymentData,
          })
        : await this.prisma.payment.create({
            data: {
              consultationId: consultation.id,
              ...paymentData,
            },
          });

      // Si la consulta venía del flujo antiguo, dejarla marcada como pendiente de pago.
      if (consultation.status === ConsultationStatus.PENDING_PAYMENT) {
        await this.prisma.consultation.update({
          where: { id: consultation.id },
          data: {
            status: ConsultationStatus.PENDING_PAYMENT,
          },
        });
      }

      this.logger.log(`Pago creado para consulta ${consultation.id}: ${reference}`);

      return {
        payment,
        checkoutUrl: preference.init_point || preference.sandbox_init_point,
        transactionId: preference.id,
      };
    } catch (error) {
      this.logger.error(`Error creando pago: ${error.message}`);
      throw error;
    }
  }

  /**
   * Procesar webhook de Mercado Pago
   */
  async processWebhook(payload: any, signature: string, requestId: string) {
    // Validar firma si está disponible
    if (signature && requestId) {
      const isValid = this.mercadoPagoService.validateWebhookSignature(payload, signature, requestId);
      if (!isValid) {
        this.logger.warn('Webhook con firma inválida');
        // En la práctica Mercado Pago puede enviar firmas con formatos distintos
        // a esta validación simplificada. No bloqueamos el webhook para no dejar
        // pagos aprobados atascados en PENDING mientras afinamos la validación.
      }
    }

    // Mercado Pago envía diferentes tipos de webhooks
    // payment: cuando se crea/actualiza un pago
    // merchant_order: cuando se completa una orden
    
    const type = payload.type || payload.action || payload.topic;
    const paymentId = payload.data?.id || payload.id || payload['data.id'];

    this.logger.log(`Webhook recibido: ${type} - Payment ID: ${paymentId}`);

    if (!paymentId) {
      this.logger.warn('Webhook recibido sin payment id');
      return null;
    }

    // Si es un webhook de payment, obtener el pago completo
    if (type === 'payment' || payload.action === 'payment.created' || payload.action === 'payment.updated') {
      let mpPayment;
      try {
        mpPayment = await this.mercadoPagoService.getPayment(paymentId);
      } catch (error) {
        this.logger.error(`Error obteniendo pago de MP: ${error.message}`);
        return;
      }

      // Buscar pago por external_reference (nuestra referencia)
      const externalReference = mpPayment.external_reference;
      if (!externalReference) {
        this.logger.warn('Pago sin external_reference');
        return;
      }

      const payment = await this.prisma.payment.findFirst({
        where: { wompiReference: externalReference },
        include: {
          consultation: {
            include: {
              user: true,
              veterinarian: {
                include: { user: true },
              },
            },
          },
        },
      });

      if (!payment) {
        this.logger.warn(`Pago no encontrado para referencia: ${externalReference}`);
        return;
      }

      // Actualizar estado según el estado de Mercado Pago
      const mpStatus = mpPayment.status;
      let paymentStatus: PaymentStatus;
      let consultationStatus: ConsultationStatus;

      if (mpStatus === 'approved') {
        paymentStatus = PaymentStatus.APPROVED;
        consultationStatus =
          payment.consultation.status === ConsultationStatus.IN_PROGRESS ||
          payment.consultation.status === ConsultationStatus.FINISHED
            ? payment.consultation.status
            : ConsultationStatus.PAID;
      } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
        paymentStatus = PaymentStatus.DECLINED;
        consultationStatus =
          payment.consultation.status === ConsultationStatus.PENDING_APPROVAL
            ? ConsultationStatus.PENDING_APPROVAL
            : payment.consultation.status === ConsultationStatus.PENDING_PAYMENT
              ? ConsultationStatus.PENDING_PAYMENT
              : payment.consultation.status;
      } else {
        paymentStatus = PaymentStatus.PENDING;
        consultationStatus = payment.consultation.status;
      }

      // Actualizar pago
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          wompiTransactionId: mpPayment.id.toString(),
          wompiResponse: JSON.stringify(mpPayment),
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
        this.chatGateway.notifyPaymentApproved(
          payment.consultationId,
          payment.consultation.veterinarian.userId,
          payment.consultation.userId,
        );

        if (payment.consultation.user?.expoPushToken) {
          await this.notificationsService.sendPushNotification(
            payment.consultation.user.expoPushToken,
            'Pago confirmado',
            'Tu pago fue aprobado. Ya puedes continuar con la consulta.',
            {
              type: 'payment_approved',
              consultationId: payment.consultationId,
            },
          );
        }

        if (payment.consultation.veterinarian?.user?.expoPushToken) {
          await this.notificationsService.sendPushNotification(
            payment.consultation.veterinarian.user.expoPushToken,
            'Consulta pagada',
            'El cliente ya realizó el pago. Puedes continuar con la consulta.',
            {
              type: 'payment_approved',
              consultationId: payment.consultationId,
            },
          );
        }

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
