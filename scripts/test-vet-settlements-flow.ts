import { config } from 'dotenv';
config();

import { randomUUID } from 'crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { PlatformConfigService } from '../src/platform-config/platform-config.service';
import { VeterinarianSettlementsService } from '../src/veterinarian-settlements/veterinarian-settlements.service';
import { MarketplacePaymentsService } from '../src/marketplace-payments/marketplace-payments.service';
import { MercadoPagoService } from '../src/marketplace-payments/mercadopago.service';
import {
  ConsultationStatus,
  PaymentStatus,
  Prisma,
  UserRole,
  VeterinarianSpecialty,
  VeterinarianStatus,
} from '@prisma/client';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  process.env.API_URL = 'http://localhost:3001';
  process.env.FRONTEND_URL = 'http://localhost:8081';

  const prisma = new PrismaService();
  await prisma.$connect();

  const platformConfigService = new PlatformConfigService(prisma);
  const settlementsService = new VeterinarianSettlementsService(
    prisma,
    platformConfigService,
  );
  const mercadoPagoService = new MercadoPagoService();
  const chatGatewayStub = {
    notifyPaymentApproved: () => undefined,
  } as any;
  const notificationsStub = {
    sendPushToUser: async () => undefined,
  } as any;
  const paymentsService = new MarketplacePaymentsService(
    prisma,
    mercadoPagoService,
    platformConfigService,
    chatGatewayStub,
    notificationsStub,
  );

  const runId = `settlement-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const ownerEmail = `${runId}-owner@testuser.com`;
  const vetEmail = `${runId}-vet@test.local`;
  const adminEmail = `${runId}-admin@test.local`;

  const cleanupEmails = [ownerEmail, vetEmail, adminEmail];

  let originalCommission = 0.15;
  let ownerUserId: number | null = null;
  let vetUserId: number | null = null;
  let adminUserId: number | null = null;

  try {
    console.log('\n1) Validando tablas y columnas de prueba...');
    await validateSchema(prisma);
    console.log('   OK: schema de liquidaciones presente en PostgreSQL local.');

    const existingConfig = await platformConfigService.getConfig();
    originalCommission = existingConfig.platformFeePercentage;

    await prisma.user.deleteMany({
      where: { email: { in: cleanupEmails } },
    });

    console.log('\n2) Creando datos base de prueba...');
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: 'test-password',
        role: UserRole.ADMIN,
        name: 'Admin Test',
      },
    });
    adminUserId = admin.id;

    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        password: 'test-password',
        role: UserRole.USER,
        name: 'Cliente Sandbox',
      },
    });
    ownerUserId = owner.id;

    const vetUser = await prisma.user.create({
      data: {
        email: vetEmail,
        password: 'test-password',
        role: UserRole.VET,
        name: 'Vet Sandbox',
      },
    });
    vetUserId = vetUser.id;

    const veterinarian = await prisma.veterinarian.create({
      data: {
        userId: vetUser.id,
        fullName: 'Veterinario Sandbox',
        country: 'Colombia',
        city: 'Bogota',
        specialty: VeterinarianSpecialty.GENERAL,
        yearsExperience: 5,
        languages: ['Español'],
        status: VeterinarianStatus.VERIFIED,
        priceChat: 30000,
        priceVoice: 45000,
        priceVideo: 60000,
      },
    });

    const pet = await prisma.pet.create({
      data: {
        ownerId: owner.id,
        name: 'Nala Test',
        species: 'DOG',
      },
    });

    const commissionConfig = await platformConfigService.updateCommission(0.2, admin.id);
    assert(
      commissionConfig.platformFeePercentage === 0.2,
      'No se pudo fijar la comision de prueba en 20%',
    );
    console.log('   OK: comision de plataforma fijada en 20% para la prueba.');

    const paymentMethod = await settlementsService.createPaymentMethod(vetUser.id, {
      type: 'BANK_ACCOUNT' as any,
      bank: 'Bancolombia',
      accountType: 'AHORROS',
      accountNumber: '1234567890',
      accountHolderName: 'Veterinario Sandbox',
      active: true,
      label: 'Cuenta principal',
    });
    assert(paymentMethod.active, 'No se pudo crear el metodo de pago activo');
    console.log('   OK: metodo de pago del veterinario creado.');

    console.log('\n3) Creando consulta y preferencia de pago sandbox...');
    const consultation = await prisma.consultation.create({
      data: {
        userId: owner.id,
        veterinarianId: veterinarian.id,
        petId: pet.id,
        type: 'CHAT',
        status: ConsultationStatus.PENDING_PAYMENT,
        price: 30000,
        platformFee: 6000,
        veterinarianAmount: 24000,
      },
    });

    const paymentCreation = await paymentsService.createPayment(
      {
        consultationId: consultation.id,
        redirectUrl: 'https://example.com/test-payment-result',
      },
      owner.id,
    );

    assert(paymentCreation.payment.id, 'No se creo el pago en BD');
    assert(paymentCreation.checkoutUrl, 'No se genero la preferencia sandbox');
    console.log(
      `   OK: preferencia Mercado Pago sandbox creada (${paymentCreation.transactionId}).`,
    );

    console.log('\n4) Simulando webhook APPROVED de Mercado Pago con fecha real...');
    const mpApprovedAt = new Date();
    mpApprovedAt.setMinutes(mpApprovedAt.getMinutes() - 30, 0, 0);

    const paymentRow = await prisma.payment.findUniqueOrThrow({
      where: { id: paymentCreation.payment.id },
    });

    (paymentsService as any).mercadoPagoService.getPayment = async () => ({
      id: paymentCreation.transactionId ?? 'sandbox-payment-id',
      status: 'approved',
      external_reference: paymentRow.wompiReference,
      date_approved: mpApprovedAt.toISOString(),
    });
    (paymentsService as any).mercadoPagoService.validateWebhookSignature = () => true;

    const firstWebhook = await paymentsService.processWebhook(
      { type: 'payment', data: { id: paymentCreation.transactionId } },
      'test-signature',
      'test-request-id',
    );
    assert(firstWebhook?.status === 'paid', 'El webhook no marco el pago como aprobado');

    const approvedPayment = await prisma.payment.findUniqueOrThrow({
      where: { id: paymentCreation.payment.id },
    });
    const approvedConsultation = await prisma.consultation.findUniqueOrThrow({
      where: { id: consultation.id },
    });

    assert(
      approvedPayment.status === PaymentStatus.APPROVED,
      'El payment.status no quedo APPROVED',
    );
    assert(approvedPayment.approvedAt, 'approvedAt no fue persistido');
    assert(
      approvedConsultation.status === ConsultationStatus.PAID,
      'La consulta no quedo en estado PAID',
    );
    console.log('   OK: webhook aplicado y approvedAt persistido.');

    console.log('\n5) Verificando idempotencia del webhook...');
    const secondWebhook = await paymentsService.processWebhook(
      { type: 'payment', data: { id: paymentCreation.transactionId } },
      'test-signature',
      'test-request-id',
    );
    assert(secondWebhook?.duplicated === true, 'El webhook repetido no fue idempotente');
    console.log('   OK: segundo webhook ignorado sin duplicar efectos.');

    console.log('\n6) Ejecutando corte diario...');
    const settlementsBefore = await prisma.veterinarianSettlement.count({
      where: { veterinarianId: veterinarian.id },
    });
    const settlements = await settlementsService.generateDailySettlements(
      new Date(mpApprovedAt),
    );

    const settlement = await prisma.veterinarianSettlement.findFirstOrThrow({
      where: {
        veterinarianId: veterinarian.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    const settlementsAfter = await prisma.veterinarianSettlement.count({
      where: { veterinarianId: veterinarian.id },
    });
    const settledConsultation = await prisma.consultation.findUniqueOrThrow({
      where: { id: consultation.id },
    });

    assert(
      settlementsAfter === settlementsBefore + 1,
      'No se genero una nueva liquidacion para el veterinario de prueba',
    );
    assert(settlement.totalGross === 30000, 'totalGross incorrecto');
    assert(settlement.totalCommission === 6000, 'totalCommission incorrecto');
    assert(settlement.totalNet === 24000, 'totalNet incorrecto');
    assert(
      settledConsultation.liquidated === true,
      'La consulta debio marcarse como liquidated al entrar al lote',
    );
    assert(
      settledConsultation.settlementId === settlement.id,
      'La consulta no quedo asociada al settlement',
    );
    console.log('   OK: lote diario creado con calculos correctos y consulta bloqueada contra duplicados.');

    console.log('\n7) Ejecutando corte de nuevo para evitar duplicados...');
    const vetSettlementCountBeforeSecondRun = await prisma.veterinarianSettlement.count({
      where: { veterinarianId: veterinarian.id },
    });
    const settlementsSecondRun = await settlementsService.generateDailySettlements(
      new Date(mpApprovedAt),
    );
    const settlementCount = await prisma.veterinarianSettlement.count({
      where: { veterinarianId: veterinarian.id },
    });
    assert(
      settlementCount === vetSettlementCountBeforeSecondRun,
      'Se detectaron liquidaciones duplicadas para el veterinario de prueba',
    );
    assert(
      !settlementsSecondRun.some((item) => item.id === settlement.id),
      'El segundo corte reproceso la liquidacion de prueba',
    );
    console.log('   OK: el corte es idempotente para consultas ya liquidadas.');

    console.log('\n8) Marcando lote como pagado...');
    const paidSettlement = await settlementsService.markSettlementAsPaid(
      settlement.id,
      {
        paymentMethodId: paymentMethod.id,
        paymentMethodUsed: 'Transferencia bancaria de prueba',
        paymentReference: 'SANDBOX-SETTLEMENT-001',
        notes: 'Pago de prueba sandbox',
      },
      adminUserId!,
    );
    assert(paidSettlement.status === 'PAID', 'El settlement no quedo pagado');
    assert(paidSettlement.paidAt, 'paidAt no se lleno');
    assert(paidSettlement.paidById === adminUserId, 'paidById no se lleno correctamente');
    assert(
      paidSettlement.paymentReference === 'SANDBOX-SETTLEMENT-001',
      'paymentReference no se guardo',
    );
    const consultationAfterPayment = await prisma.consultation.findUnique({
      where: { id: settledConsultation.id },
      select: { liquidated: true, liquidatedAt: true, settlementId: true },
    });
    assert(
      consultationAfterPayment?.liquidated === true &&
        consultationAfterPayment.liquidatedAt &&
        consultationAfterPayment.settlementId === settlement.id,
      'La consulta no quedo sincronizada tras pagar la liquidacion',
    );
    console.log('   OK: lote marcado como pagado y consultas sincronizadas.');

    let doublePayBlocked = false;
    try {
      await settlementsService.markSettlementAsPaid(
        settlement.id,
        {
          paymentMethodId: paymentMethod.id,
        },
        adminUserId!,
      );
    } catch {
      doublePayBlocked = true;
    }
    assert(doublePayBlocked, 'Se permitio pagar dos veces el mismo settlement');
    console.log('   OK: doble pago bloqueado correctamente.');

    console.log('\n9) Consultando endpoints logicos del servicio...');
    const dashboard = await settlementsService.getVeterinarianDashboard(vetUser.id);
    const history = await settlementsService.listVeterinarianSettlements(vetUser.id);
    assert(dashboard.summary.totalGenerated >= 30000, 'Resumen inconsistente');
    assert(history.length === 1, 'Historial de liquidaciones inconsistente');
    console.log('   OK: resumen e historial disponibles para el veterinario.');

    console.log('\nRESULTADO: flujo de liquidaciones validado en entorno local de pruebas.');
  } finally {
    try {
      if (adminUserId != null) {
        await platformConfigService.updateCommission(originalCommission, adminUserId);
      }
    } catch {
      // Ignorar errores al restaurar configuracion
    }

    await prisma.user.deleteMany({
      where: { email: { in: cleanupEmails } },
    });
    await prisma.$disconnect();
  }
}

async function validateSchema(prisma: PrismaService) {
  const expectedTables = [
    'Consultation',
    'Payment',
    'VeterinarianSettlement',
    'VeterinarianPaymentMethod',
  ];

  const tables = (await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (${Prisma.join(expectedTables)})
  `) as Array<{ table_name: string }>;

  const tableNames = new Set(tables.map((row) => row.table_name));
  for (const tableName of expectedTables) {
    assert(tableNames.has(tableName), `Falta la tabla ${tableName}`);
  }

  const requiredColumns: Record<string, string[]> = {
    Consultation: ['id', 'veterinarianId', 'price', 'liquidated', 'settlementId'],
    Payment: ['id', 'consultationId', 'amount', 'status', 'approvedAt'],
    VeterinarianSettlement: [
      'id',
      'veterinarianId',
      'settlementDate',
      'totalGross',
      'totalCommission',
      'totalNet',
      'status',
      'paidAt',
    ],
    VeterinarianPaymentMethod: [
      'id',
      'veterinarianId',
      'type',
      'details',
      'active',
    ],
  };

  for (const [tableName, columns] of Object.entries(requiredColumns)) {
    const rows = (await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
    `) as Array<{ column_name: string }>;

    const currentColumns = new Set(rows.map((row) => row.column_name));
    for (const column of columns) {
      assert(currentColumns.has(column), `Falta la columna ${tableName}.${column}`);
    }
  }
}

main().catch((error) => {
  console.error('\nFALLO EN PRUEBA DE LIQUIDACIONES:', error);
  process.exitCode = 1;
});
