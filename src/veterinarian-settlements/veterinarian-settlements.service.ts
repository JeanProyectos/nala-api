import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  ConsultationStatus,
  PaymentStatus,
  Prisma,
  SettlementPaymentStatus,
  VeterinarianPaymentMethodType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { MarkSettlementPaidDto } from './dto/mark-settlement-paid.dto';

const ELIGIBLE_SETTLEMENT_STATUSES: ConsultationStatus[] = [
  ConsultationStatus.PAID,
  ConsultationStatus.IN_PROGRESS,
  ConsultationStatus.FINISHED,
];

@Injectable()
export class VeterinarianSettlementsService {
  private readonly logger = new Logger(VeterinarianSettlementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly platformConfigService: PlatformConfigService,
  ) {}

  @Cron('0 0 22 * * *')
  async handleDailyCutoff() {
    try {
      await this.generateDailySettlements();
    } catch (error) {
      this.logger.error(
        `Error ejecutando corte diario: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  async getVeterinarianDashboard(userId: number) {
    const veterinarian = await this.getVeterinarianByUserId(userId);
    const commissionPercentage =
      await this.platformConfigService.getCommissionPercentage();
    const paymentMethods = await this.prisma.veterinarianPaymentMethod.findMany({
      where: { veterinarianId: veterinarian.id },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    });

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const todayCutoff = new Date(now);
    todayCutoff.setHours(22, 0, 0, 0);

    const todaySummaryEnd = now > todayCutoff ? todayCutoff : now;

    const [todayPayments, recentPayments, recentSettlements, pendingSettlements] =
      await Promise.all([
        this.prisma.payment.findMany({
          where: {
            status: PaymentStatus.APPROVED,
            consultation: {
              veterinarianId: veterinarian.id,
              status: {
                in: ELIGIBLE_SETTLEMENT_STATUSES,
              },
            },
            approvedAt: {
              gte: startOfToday,
              lte: todaySummaryEnd,
            },
          },
          include: {
            consultation: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                pet: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                settlement: {
                  select: {
                    id: true,
                    settlementDate: true,
                    status: true,
                    paidAt: true,
                  },
                },
              },
            },
          },
          orderBy: [{ approvedAt: 'desc' }],
        }),
        this.prisma.payment.findMany({
          where: {
            status: PaymentStatus.APPROVED,
            consultation: {
              veterinarianId: veterinarian.id,
              status: {
                in: ELIGIBLE_SETTLEMENT_STATUSES,
              },
            },
          },
          include: {
            consultation: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                pet: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                settlement: {
                  select: {
                    id: true,
                    settlementDate: true,
                    status: true,
                    paidAt: true,
                  },
                },
              },
            },
          },
          orderBy: [{ approvedAt: 'desc' }],
          take: 30,
        }),
        this.prisma.veterinarianSettlement.findMany({
          where: { veterinarianId: veterinarian.id },
          include: {
            paymentMethod: true,
          },
          orderBy: [{ settlementDate: 'desc' }, { createdAt: 'desc' }],
          take: 10,
        }),
        this.prisma.veterinarianSettlement.findMany({
          where: {
            veterinarianId: veterinarian.id,
            status: SettlementPaymentStatus.PENDING,
          },
          select: {
            totalNet: true,
          },
        }),
      ]);

    const summary = todayPayments.reduce(
      (acc, payment) => {
        acc.totalConsultations += 1;
        acc.totalGross = this.roundCurrency(acc.totalGross + payment.amount);
        acc.totalCommission = this.roundCurrency(
          acc.totalCommission + payment.platformFee,
        );
        acc.totalNet = this.roundCurrency(
          acc.totalNet + payment.veterinarianAmount,
        );
        return acc;
      },
      {
        totalConsultations: 0,
        totalGross: 0,
        totalCommission: 0,
        totalNet: 0,
      },
    );

    const pendingSettlementNet = pendingSettlements.reduce(
      (total, settlement) => this.roundCurrency(total + settlement.totalNet),
      0,
    );

    return {
      summary: {
        date: startOfToday,
        cutoffAt: todayCutoff,
        totalConsultations: summary.totalConsultations,
        totalGenerated: summary.totalGross,
        totalCommission: summary.totalCommission,
        totalNet: summary.totalNet,
        pendingSettlementNet,
        commissionPercentage,
        commissionText: `La aplicacion cobra un ${Math.round(
          commissionPercentage * 100,
        )}% por cada consulta realizada.`,
      },
      activePaymentMethod:
        paymentMethods.find((method) => method.active) ?? null,
      paymentMethods: paymentMethods.map((method) =>
        this.serializePaymentMethod(method),
      ),
      consultationHistory: recentPayments.map((payment) =>
        this.serializePaymentHistoryItem(payment),
      ),
      todayHistory: todayPayments.map((payment) =>
        this.serializePaymentHistoryItem(payment),
      ),
      settlements: recentSettlements.map((settlement) =>
        this.serializeSettlement(settlement),
      ),
    };
  }

  async listVeterinarianSettlements(userId: number) {
    const veterinarian = await this.getVeterinarianByUserId(userId);
    const settlements = await this.prisma.veterinarianSettlement.findMany({
      where: { veterinarianId: veterinarian.id },
      include: {
        paymentMethod: true,
        consultations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            pet: {
              select: {
                id: true,
                name: true,
              },
            },
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ settlementDate: 'desc' }, { createdAt: 'desc' }],
    });

    return settlements.map((settlement) => ({
      ...this.serializeSettlement(settlement),
      consultations: settlement.consultations.map((consultation) => ({
        consultationId: consultation.id,
        consultationDate: consultation.createdAt,
        approvedAt: consultation.payment?.approvedAt ?? null,
        client: consultation.user.name || consultation.user.email,
        petName: consultation.pet?.name ?? null,
        amount: consultation.price,
        commission: consultation.platformFee,
        netAmount: consultation.veterinarianAmount,
        liquidated: consultation.liquidated,
        paymentLifecycleStatus: this.getPaymentLifecycleStatus(consultation),
      })),
    }));
  }

  async listPaymentMethods(userId: number) {
    const veterinarian = await this.getVeterinarianByUserId(userId);
    const methods = await this.prisma.veterinarianPaymentMethod.findMany({
      where: { veterinarianId: veterinarian.id },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    });

    return methods.map((method) => this.serializePaymentMethod(method));
  }

  async createPaymentMethod(userId: number, dto: CreatePaymentMethodDto) {
    const veterinarian = await this.getVeterinarianByUserId(userId);
    const methodData = this.buildPaymentMethodData(dto);

    const created = await this.prisma.$transaction(async (tx) => {
      if (dto.active) {
        await tx.veterinarianPaymentMethod.updateMany({
          where: { veterinarianId: veterinarian.id, active: true },
          data: { active: false },
        });
      }

      return tx.veterinarianPaymentMethod.create({
        data: {
          veterinarianId: veterinarian.id,
          type: dto.type,
          label: methodData.label,
          details: methodData.details,
          active: dto.active ?? false,
        },
      });
    });

    return this.serializePaymentMethod(created);
  }

  async updatePaymentMethod(
    userId: number,
    paymentMethodId: number,
    dto: UpdatePaymentMethodDto,
  ) {
    const veterinarian = await this.getVeterinarianByUserId(userId);
    const existing = await this.prisma.veterinarianPaymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        veterinarianId: veterinarian.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Metodo de pago no encontrado');
    }

    const baseDto: CreatePaymentMethodDto = {
      type: dto.type ?? existing.type,
      label: dto.label ?? existing.label,
      bank: dto.bank ?? this.getDetailValue(existing.details, 'bank'),
      accountType:
        dto.accountType ?? this.getDetailValue(existing.details, 'accountType'),
      accountNumber:
        dto.accountNumber ??
        this.getDetailValue(existing.details, 'accountNumber'),
      walletProvider:
        dto.walletProvider ??
        this.getDetailValue(existing.details, 'walletProvider'),
      walletNumber:
        dto.walletNumber ?? this.getDetailValue(existing.details, 'walletNumber'),
      accountHolderName:
        dto.accountHolderName ??
        this.getDetailValue(existing.details, 'accountHolderName') ??
        '',
      active: dto.active ?? existing.active,
    };

    const methodData = this.buildPaymentMethodData(baseDto);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.active) {
        await tx.veterinarianPaymentMethod.updateMany({
          where: {
            veterinarianId: veterinarian.id,
            active: true,
            id: { not: paymentMethodId },
          },
          data: { active: false },
        });
      }

      return tx.veterinarianPaymentMethod.update({
        where: { id: paymentMethodId },
        data: {
          type: baseDto.type,
          label: methodData.label,
          details: methodData.details,
          active: baseDto.active ?? existing.active,
        },
      });
    });

    return this.serializePaymentMethod(updated);
  }

  async activatePaymentMethod(userId: number, paymentMethodId: number) {
    const veterinarian = await this.getVeterinarianByUserId(userId);
    const existing = await this.prisma.veterinarianPaymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        veterinarianId: veterinarian.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Metodo de pago no encontrado');
    }

    await this.prisma.$transaction([
      this.prisma.veterinarianPaymentMethod.updateMany({
        where: { veterinarianId: veterinarian.id, active: true },
        data: { active: false },
      }),
      this.prisma.veterinarianPaymentMethod.update({
        where: { id: paymentMethodId },
        data: { active: true },
      }),
    ]);

    return this.listPaymentMethods(userId);
  }

  async listPendingSettlements() {
    const settlements = await this.prisma.veterinarianSettlement.findMany({
      where: { status: SettlementPaymentStatus.PENDING },
      include: {
        veterinarian: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        paymentMethod: true,
      },
      orderBy: [{ settlementDate: 'asc' }, { createdAt: 'asc' }],
    });

    return settlements.map((settlement) => ({
      ...this.serializeSettlement(settlement),
      veterinarian: {
        id: settlement.veterinarian.id,
        fullName: settlement.veterinarian.fullName,
        email: settlement.veterinarian.user.email,
      },
    }));
  }

  async markSettlementAsPaid(
    settlementId: number,
    dto: MarkSettlementPaidDto,
    paidById: number,
  ) {
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const settlement = await tx.veterinarianSettlement.findUnique({
          where: { id: settlementId },
          include: {
            consultations: {
              select: {
                id: true,
                settlementId: true,
                liquidated: true,
                payment: {
                  select: {
                    id: true,
                    status: true,
                  },
                },
              },
            },
            veterinarian: {
              include: {
                paymentMethods: true,
              },
            },
          },
        });

        if (!settlement) {
          this.logger.warn(
            `Intento invalido de pago: liquidacion ${settlementId} no existe. Usuario=${paidById}`,
          );
          throw new NotFoundException('Liquidacion no encontrada');
        }

        if (
          settlement.status !== SettlementPaymentStatus.PENDING ||
          settlement.paidAt
        ) {
          this.logger.warn(
            `Intento de doble pago bloqueado para liquidacion ${settlementId}. Estado=${settlement.status}, paidAt=${settlement.paidAt?.toISOString() ?? 'null'}, usuario=${paidById}`,
          );
          throw new BadRequestException(
            'La liquidacion ya fue marcada como pagada o no esta pendiente',
          );
        }

        if (settlement.consultations.length === 0) {
          throw new BadRequestException(
            'No se puede pagar una liquidacion sin consultas asociadas',
          );
        }

        const invalidConsultation = settlement.consultations.find(
          (consultation) =>
            consultation.settlementId !== settlement.id ||
            consultation.payment?.status !== PaymentStatus.APPROVED,
        );

        if (invalidConsultation) {
          this.logger.warn(
            `Pago bloqueado por consulta inconsistente ${invalidConsultation.id} en liquidacion ${settlementId}. Usuario=${paidById}`,
          );
          throw new BadRequestException(
            'Todas las consultas deben pertenecer a la liquidacion y tener pago aprobado',
          );
        }

        const selectedMethod =
          (dto.paymentMethodId
            ? settlement.veterinarian.paymentMethods.find(
                (method) => method.id === dto.paymentMethodId,
              )
            : null) ??
          (settlement.paymentMethodId
            ? settlement.veterinarian.paymentMethods.find(
                (method) => method.id === settlement.paymentMethodId,
              )
            : null) ??
          settlement.veterinarian.paymentMethods.find((method) => method.active);

        if (!selectedMethod) {
          throw new BadRequestException(
            'Debes configurar o seleccionar un metodo de pago para marcar la liquidacion como pagada',
          );
        }

        const paidAt = new Date();
        const paymentMethodUsed = dto.paymentMethodUsed?.trim() || selectedMethod.label;

        const lockedSettlement = await tx.veterinarianSettlement.updateMany({
          where: {
            id: settlementId,
            status: SettlementPaymentStatus.PENDING,
            paidAt: null,
          },
          data: {
            status: SettlementPaymentStatus.PAID,
            paidAt,
            paidById,
            paymentMethodId: selectedMethod.id,
            paymentMethodUsed,
            paymentReference: dto.paymentReference?.trim() || null,
            notes: dto.notes ?? settlement.notes,
          },
        });

        if (lockedSettlement.count !== 1) {
          this.logger.warn(
            `Pago concurrente bloqueado para liquidacion ${settlementId}. Usuario=${paidById}`,
          );
          throw new BadRequestException(
            'La liquidacion ya fue procesada por otro usuario',
          );
        }

        await tx.consultation.updateMany({
          where: {
            settlementId: settlement.id,
          },
          data: {
            liquidated: true,
            liquidatedAt: paidAt,
          },
        });

        const inconsistentConsultations = await tx.consultation.count({
          where: {
            settlementId: settlement.id,
            liquidated: false,
          },
        });

        if (inconsistentConsultations > 0) {
          throw new BadRequestException(
            'La liquidacion quedo con consultas sin sincronizar',
          );
        }

        return tx.veterinarianSettlement.findUniqueOrThrow({
          where: { id: settlement.id },
          include: {
            paymentMethod: true,
          },
        });
      });

      this.logger.log(
        `Liquidacion ${settlementId} cambio PENDING -> PAID. Usuario=${paidById}, metodo=${updated.paymentMethodUsed ?? updated.paymentMethod?.label ?? 'N/A'}, referencia=${updated.paymentReference ?? 'N/A'}`,
      );

      return this.serializeSettlement(updated);
    } catch (error) {
      this.logger.error(
        `Error marcando liquidacion ${settlementId} como pagada por usuario ${paidById}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      throw error;
    }
  }

  async generateDailySettlements(referenceDate: Date = new Date()) {
    const cutoffAt = new Date(referenceDate);
    cutoffAt.setHours(22, 0, 0, 0);

    const eligibleConsultations = await this.prisma.consultation.findMany({
      where: {
        settlementId: null,
        liquidated: false,
        status: {
          in: ELIGIBLE_SETTLEMENT_STATUSES,
        },
        payment: {
          is: {
            status: PaymentStatus.APPROVED,
            approvedAt: {
              lte: cutoffAt,
            },
          },
        },
      },
      select: {
        veterinarianId: true,
      },
    });

    const veterinarianIds = [
      ...new Set(eligibleConsultations.map((consultation) => consultation.veterinarianId)),
    ];

    const createdSettlements: any[] = [];

    for (const veterinarianId of veterinarianIds) {
      const settlement = await this.createOrUpdateSettlementForVeterinarian(
        veterinarianId,
        cutoffAt,
      );

      if (settlement) {
        createdSettlements.push(settlement);
      }
    }

    if (createdSettlements.length > 0) {
      this.logger.log(
        `Se generaron ${createdSettlements.length} liquidaciones con corte ${cutoffAt.toISOString()}`,
      );
    }

    return createdSettlements.map((settlement) =>
      this.serializeSettlement(settlement),
    );
  }

  private async createOrUpdateSettlementForVeterinarian(
    veterinarianId: number,
    cutoffAt: Date,
  ) {
    const settlementDate = new Date(cutoffAt);
    settlementDate.setHours(0, 0, 0, 0);

    return this.prisma.$transaction(async (tx) => {
      const consultationsToAttach = await tx.consultation.findMany({
        where: {
          veterinarianId,
          settlementId: null,
          liquidated: false,
          status: {
            in: ELIGIBLE_SETTLEMENT_STATUSES,
          },
          payment: {
            is: {
              status: PaymentStatus.APPROVED,
              approvedAt: {
                lte: cutoffAt,
              },
            },
          },
        },
        select: {
          id: true,
          price: true,
          platformFee: true,
          veterinarianAmount: true,
        },
      });

      const existing = await tx.veterinarianSettlement.findUnique({
        where: {
          veterinarianId_settlementDate: {
            veterinarianId,
            settlementDate,
          },
        },
        include: {
          consultations: {
            select: {
              id: true,
              price: true,
              platformFee: true,
              veterinarianAmount: true,
            },
          },
        },
      });

      if (!existing && consultationsToAttach.length === 0) {
        return null;
      }

      const allConsultations = [
        ...(existing?.consultations ?? []),
        ...consultationsToAttach,
      ];

      const totals = allConsultations.reduce(
        (acc, consultation) => {
          acc.totalConsultations += 1;
          acc.totalGross = this.roundCurrency(acc.totalGross + consultation.price);
          acc.totalCommission = this.roundCurrency(
            acc.totalCommission + consultation.platformFee,
          );
          acc.totalNet = this.roundCurrency(
            acc.totalNet + consultation.veterinarianAmount,
          );
          return acc;
        },
        {
          totalConsultations: 0,
          totalGross: 0,
          totalCommission: 0,
          totalNet: 0,
        },
      );

      if (existing) {
        const updatedSettlement = await tx.veterinarianSettlement.update({
          where: { id: existing.id },
          data: {
            cutoffAt,
            totalConsultations: totals.totalConsultations,
            totalGross: totals.totalGross,
            totalCommission: totals.totalCommission,
            totalNet: totals.totalNet,
            consultations: {
              connect: consultationsToAttach.map((consultation) => ({
                id: consultation.id,
              })),
            },
          },
          include: {
            paymentMethod: true,
          },
        });

        if (consultationsToAttach.length > 0) {
          await tx.consultation.updateMany({
            where: {
              id: {
                in: consultationsToAttach.map((consultation) => consultation.id),
              },
            },
            data: {
              liquidated: true,
              liquidatedAt: cutoffAt,
            },
          });
        }

        this.logger.log(
          `Liquidacion ${existing.id} actualizada para veterinario ${veterinarianId} con ${consultationsToAttach.length} consulta(s) nueva(s)`,
        );

        return updatedSettlement;
      }

      const createdSettlement = await tx.veterinarianSettlement.create({
        data: {
          veterinarianId,
          settlementDate,
          cutoffAt,
          totalConsultations: totals.totalConsultations,
          totalGross: totals.totalGross,
          totalCommission: totals.totalCommission,
          totalNet: totals.totalNet,
          consultations: {
            connect: consultationsToAttach.map((consultation) => ({
              id: consultation.id,
            })),
          },
        },
        include: {
          paymentMethod: true,
        },
      });

      if (consultationsToAttach.length > 0) {
        await tx.consultation.updateMany({
          where: {
            id: {
              in: consultationsToAttach.map((consultation) => consultation.id),
            },
          },
          data: {
            liquidated: true,
            liquidatedAt: cutoffAt,
          },
        });
      }

      this.logger.log(
        `Liquidacion ${createdSettlement.id} creada para veterinario ${veterinarianId} con ${consultationsToAttach.length} consulta(s)`,
      );

      return createdSettlement;
    });
  }

  private async getVeterinarianByUserId(userId: number) {
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { userId },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    return veterinarian;
  }

  private buildPaymentMethodData(dto: CreatePaymentMethodDto) {
    if (dto.type === VeterinarianPaymentMethodType.BANK_ACCOUNT) {
      if (!dto.bank || !dto.accountType || !dto.accountNumber) {
        throw new BadRequestException(
          'Debes completar banco, tipo de cuenta y numero de cuenta',
        );
      }

      return {
        label:
          dto.label || `${dto.bank} - ${dto.accountType} (${dto.accountNumber.slice(-4)})`,
        details: {
          bank: dto.bank,
          accountType: dto.accountType,
          accountNumber: dto.accountNumber,
          accountHolderName: dto.accountHolderName,
        } satisfies Prisma.InputJsonObject,
      };
    }

    if (!dto.walletProvider || !dto.walletNumber) {
      throw new BadRequestException(
        'Debes completar proveedor y numero de billetera',
      );
    }

    return {
      label:
        dto.label ||
        `${dto.walletProvider} (${dto.walletNumber.slice(-4)})`,
      details: {
        walletProvider: dto.walletProvider,
        walletNumber: dto.walletNumber,
        accountHolderName: dto.accountHolderName,
      } satisfies Prisma.InputJsonObject,
    };
  }

  private serializePaymentHistoryItem(payment: {
    amount: number;
    platformFee: number;
    veterinarianAmount: number;
    approvedAt: Date | null;
    updatedAt: Date;
    consultation: {
      id: number;
      createdAt: Date;
      liquidated: boolean;
      user: { name: string | null; email: string };
      pet: { name: string } | null;
      settlement:
        | {
            id: number;
            settlementDate: Date;
            status: SettlementPaymentStatus;
            paidAt: Date | null;
          }
        | null;
    };
  }) {
    return {
      consultationId: payment.consultation.id,
      consultationDate: payment.consultation.createdAt,
      approvedAt: payment.approvedAt,
      client: payment.consultation.user.name || payment.consultation.user.email,
      petName: payment.consultation.pet?.name ?? null,
      amount: payment.amount,
      commission: payment.platformFee,
      netAmount: payment.veterinarianAmount,
      liquidated: payment.consultation.liquidated,
      settlementId: payment.consultation.settlement?.id ?? null,
      settlementDate: payment.consultation.settlement?.settlementDate ?? null,
      settlementStatus: payment.consultation.settlement?.status ?? null,
      paidAt: payment.consultation.settlement?.paidAt ?? null,
      paymentLifecycleStatus: this.getPaymentLifecycleStatus(
        payment.consultation,
      ),
    };
  }

  private serializeSettlement(settlement: {
    id: number;
    settlementDate: Date;
    cutoffAt: Date;
    totalConsultations: number;
    totalGross: number;
    totalCommission: number;
    totalNet: number;
    status: SettlementPaymentStatus;
    paidAt: Date | null;
    paidById?: number | null;
    paymentMethodUsed?: string | null;
    paymentReference?: string | null;
    notes?: string | null;
    createdAt: Date;
    paymentMethod?:
      | {
          id: number;
          type: VeterinarianPaymentMethodType;
          label: string;
          details: Prisma.JsonValue;
          active: boolean;
        }
      | null;
  }) {
    return {
      id: settlement.id,
      settlementDate: settlement.settlementDate,
      cutoffAt: settlement.cutoffAt,
      totalConsultations: settlement.totalConsultations,
      totalGross: settlement.totalGross,
      totalCommission: settlement.totalCommission,
      totalNet: settlement.totalNet,
      status: settlement.status,
      paidAt: settlement.paidAt,
      paidById: settlement.paidById ?? null,
      paymentMethodUsed: settlement.paymentMethodUsed ?? null,
      paymentReference: settlement.paymentReference ?? null,
      notes: settlement.notes ?? null,
      createdAt: settlement.createdAt,
      paymentMethod: settlement.paymentMethod
        ? this.serializePaymentMethod(settlement.paymentMethod)
        : null,
    };
  }

  private serializePaymentMethod(method: {
    id: number;
    type: VeterinarianPaymentMethodType;
    label: string;
    details: Prisma.JsonValue;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    return {
      id: method.id,
      type: method.type,
      label: method.label,
      details: method.details,
      active: method.active,
      createdAt: method.createdAt,
      updatedAt: method.updatedAt,
    };
  }

  private getPaymentLifecycleStatus(consultation: {
    liquidated: boolean;
    settlement?:
      | {
          status: SettlementPaymentStatus;
        }
      | null;
  }) {
    if (
      consultation.settlement?.status === SettlementPaymentStatus.PAID &&
      consultation.liquidated
    ) {
      return 'LIQUIDATED';
    }

    if (
      consultation.settlement?.status === SettlementPaymentStatus.PENDING ||
      consultation.liquidated
    ) {
      return 'PENDING_SETTLEMENT';
    }

    return 'PAID';
  }

  private getDetailValue(details: Prisma.JsonValue, key: string) {
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
      return undefined;
    }

    const value = (details as Record<string, string | undefined>)[key];
    return typeof value === 'string' ? value : undefined;
  }

  private roundCurrency(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
