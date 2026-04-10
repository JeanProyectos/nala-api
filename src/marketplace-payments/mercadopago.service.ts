import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly baseUrl = process.env.MP_BASE_URL || 'https://api.mercadopago.com';
  private readonly accessToken = process.env.MP_ACCESS_TOKEN;
  private readonly publicKey = process.env.MP_PUBLIC_KEY;
  private readonly webhookSecret = process.env.MP_WEBHOOK_SECRET;

  /**
   * Crear preferencia de pago en Mercado Pago
   * Para marketplace, se usa split payment con application_fee
   */
  async createPreference(preferenceData: {
    amount: number;
    currency: string;
    payerEmail: string;
    description: string;
    externalReference: string;
    backUrls?: {
      success?: string;
      failure?: string;
      pending?: string;
    };
    applicationFee?: number; // Comisión de la plataforma
    marketplaceFee?: number; // Comisión del marketplace (Mercado Pago)
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/checkout/preferences`,
        {
          items: [
            {
              title: preferenceData.description,
              quantity: 1,
              unit_price: preferenceData.amount,
              currency_id: preferenceData.currency,
            },
          ],
          payer: {
            email: preferenceData.payerEmail,
          },
          external_reference: preferenceData.externalReference,
          back_urls: preferenceData.backUrls || {},
          auto_return: 'approved',
          // Para marketplace, configurar application_fee
          ...(preferenceData.applicationFee && {
            application_fee: preferenceData.applicationFee,
          }),
          ...(preferenceData.marketplaceFee && {
            marketplace_fee: preferenceData.marketplaceFee,
          }),
          notification_url: `${process.env.API_URL || 'http://localhost:3000'}/marketplace/payments/mercadopago/webhook`,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Preferencia creada: ${preferenceData.externalReference}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error creando preferencia: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  /**
   * Obtener información de un pago
   */
  async getPayment(paymentId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error obteniendo pago: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  /**
   * Validar firma del webhook de Mercado Pago
   */
  validateWebhookSignature(payload: any, signature: string, xRequestId: string): boolean {
    try {
      if (!this.webhookSecret) {
        this.logger.warn('MP_WEBHOOK_SECRET no configurado');
        return false;
      }

      // Mercado Pago usa x-signature y x-request-id para validar webhooks
      // La firma se genera con: HMAC-SHA256(payload + x-request-id, webhook_secret)
      const payloadString = JSON.stringify(payload);
      const dataToSign = payloadString + xRequestId;
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(dataToSign)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error(`Error validando firma: ${error.message}`);
      return false;
    }
  }

  /**
   * Crear usuario vendedor en Mercado Pago (para marketplace)
   * Esto es necesario para que los veterinarios reciban pagos
   */
  async createSeller(sellerData: {
    email: string;
    firstName: string;
    lastName: string;
    identification: {
      type: string; // 'DNI', 'CI', 'LC', 'LE', etc.
      number: string;
    };
    phone?: {
      areaCode: string;
      number: string;
    };
  }) {
    try {
      // En Mercado Pago, los vendedores se crean a través de la API de usuarios
      // Esto requiere configuración adicional en el dashboard de Mercado Pago
      // Por ahora, retornamos un objeto simulado
      // En producción, necesitarías usar la API de usuarios de Mercado Pago
      
      this.logger.log(`Vendedor creado para: ${sellerData.email}`);
      
      // Nota: En producción, aquí deberías hacer la llamada real a la API de Mercado Pago
      // para crear el usuario vendedor. Esto requiere permisos especiales.
      
      return {
        id: `mp_seller_${Date.now()}`,
        email: sellerData.email,
        status: 'pending',
      };
    } catch (error) {
      this.logger.error(`Error creando vendedor: ${error.response?.data || error.message}`);
      throw error;
    }
  }
}
