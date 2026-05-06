-- CreateEnum
CREATE TYPE "SettlementPaymentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "VeterinarianPaymentMethodType" AS ENUM ('BANK_ACCOUNT', 'MOBILE_WALLET');

-- AlterTable
ALTER TABLE "Consultation"
ADD COLUMN "liquidated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "liquidatedAt" TIMESTAMP(3),
ADD COLUMN "settlementId" INTEGER;

-- AlterTable
ALTER TABLE "Payment"
ADD COLUMN "approvedAt" TIMESTAMP(3);

-- Backfill de pagos aprobados existentes
UPDATE "Payment"
SET "approvedAt" = "updatedAt"
WHERE "status" = 'APPROVED' AND "approvedAt" IS NULL;

-- CreateTable
CREATE TABLE "VeterinarianPaymentMethod" (
    "id" SERIAL NOT NULL,
    "veterinarianId" INTEGER NOT NULL,
    "type" "VeterinarianPaymentMethodType" NOT NULL,
    "label" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VeterinarianPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VeterinarianSettlement" (
    "id" SERIAL NOT NULL,
    "veterinarianId" INTEGER NOT NULL,
    "settlementDate" DATE NOT NULL,
    "cutoffAt" TIMESTAMP(3) NOT NULL,
    "totalConsultations" INTEGER NOT NULL,
    "totalGross" DOUBLE PRECISION NOT NULL,
    "totalCommission" DOUBLE PRECISION NOT NULL,
    "totalNet" DOUBLE PRECISION NOT NULL,
    "status" "SettlementPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paymentMethodId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VeterinarianSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Consultation_liquidated_idx" ON "Consultation"("liquidated");

-- CreateIndex
CREATE INDEX "Consultation_settlementId_idx" ON "Consultation"("settlementId");

-- CreateIndex
CREATE INDEX "Payment_approvedAt_idx" ON "Payment"("approvedAt");

-- CreateIndex
CREATE INDEX "VeterinarianPaymentMethod_veterinarianId_idx" ON "VeterinarianPaymentMethod"("veterinarianId");

-- CreateIndex
CREATE INDEX "VeterinarianPaymentMethod_active_idx" ON "VeterinarianPaymentMethod"("active");

-- CreateIndex
CREATE UNIQUE INDEX "VeterinarianSettlement_veterinarianId_settlementDate_key" ON "VeterinarianSettlement"("veterinarianId", "settlementDate");

-- CreateIndex
CREATE INDEX "VeterinarianSettlement_status_idx" ON "VeterinarianSettlement"("status");

-- CreateIndex
CREATE INDEX "VeterinarianSettlement_cutoffAt_idx" ON "VeterinarianSettlement"("cutoffAt");

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "VeterinarianSettlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VeterinarianPaymentMethod" ADD CONSTRAINT "VeterinarianPaymentMethod_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "Veterinarian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VeterinarianSettlement" ADD CONSTRAINT "VeterinarianSettlement_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "Veterinarian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VeterinarianSettlement" ADD CONSTRAINT "VeterinarianSettlement_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "VeterinarianPaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
