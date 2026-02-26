import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WompiService {
  private readonly logger = new Logger(WompiService.name);
  private readonly baseUrl = process.env.WOMPI_BASE_URL || 'https://production.wompi.co/v1';
  private readonly publicKey = process.env.WOMPI_PUBLIC_KEY;
  private readonly privateKey = process.env.WOMPI_PRIVATE_KEY;
  private readonly integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

  /**
   * Crear subcuenta (subcomercio) para veterinario en Wompi Marketplace
   */
  async createSubaccount(veterinarianData: {
    email: string;
    legalName: string;
    contactName: string;
    phoneNumber: string;
    legalId: string; // Cédula o NIT
    accountType: 'COLLECTION' | 'DISPERSION';
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/subaccounts`,
        {
          email: veterinarianData.email,
          name: veterinarianData.legalName,
          contact_name: veterinarianData.contactName,
          phone_number: veterinarianData.phoneNumber,
          legal_id: veterinarianData.legalId,
          account_type: veterinarianData.accountType,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.privateKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Subcuenta creada para veterinario: ${veterinarianData.email}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error creando subcuenta: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  /**
   * Crear transacción con split payment (Marketplace)
   * Para Wompi Marketplace, se crea un checkout que divide el pago automáticamente
   */
  async createTransaction(transactionData: {
    amountInCents: number;
    currency: string;
    customerEmail: string;
    reference: string;
    redirectUrl: string;
    split: {
      merchantId: string; // ID de la subcuenta del veterinario
      amountInCents: number; // Monto para el veterinario
    };
  }) {
    try {
      // Obtener token de aceptación
      const acceptanceToken = await this.generateAcceptanceToken();

      const response = await axios.post(
        `${this.baseUrl}/transactions`,
        {
          amount_in_cents: transactionData.amountInCents,
          currency: transactionData.currency,
          customer_email: transactionData.customerEmail,
          reference: transactionData.reference,
          acceptance_token: acceptanceToken,
          redirect_url: transactionData.redirectUrl,
          split: transactionData.split,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.publicKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Transacción creada: ${transactionData.reference}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error creando transacción: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  /**
   * Obtener información de una transacción
   */
  async getTransaction(transactionId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.publicKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error obteniendo transacción: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  /**
   * Validar firma del webhook de Wompi
   */
  validateWebhookSignature(payload: any, signature: string): boolean {
    try {
      if (!this.integritySecret) {
        this.logger.warn('WOMPI_INTEGRITY_SECRET no configurado');
        return false;
      }

      const payloadString = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', this.integritySecret)
        .update(payloadString)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error(`Error validando firma: ${error.message}`);
      return false;
    }
  }

  /**
   * Generar token de aceptación para método de pago
   */
  async generateAcceptanceToken() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/merchants/${this.publicKey}`,
        {
          headers: {
            'Authorization': `Bearer ${this.publicKey}`,
          },
        }
      );

      if (response.data?.data?.presigned_acceptance?.acceptance_token) {
        return response.data.data.presigned_acceptance.acceptance_token;
      }
      
      // Si no viene en esa estructura, intentar otra
      if (response.data?.data?.acceptance_token) {
        return response.data.data.acceptance_token;
      }

      throw new Error('No se pudo obtener el token de aceptación');
    } catch (error) {
      this.logger.error(`Error obteniendo token de aceptación: ${error.response?.data || error.message}`);
      throw error;
    }
  }
}
