/*
  Warnings:

  - The values [PENDING,ACTIVE] on the enum `ConsultationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cost` on the `Consultation` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerConsultation` on the `Veterinarian` table. All the data in the column will be lost.
  - Added the required column `platformFee` to the `Consultation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Consultation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `veterinarianAmount` to the `Consultation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'ERROR');

-- CreateEnum
CREATE TYPE "WompiAccountStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "ConsultationStatus_new" AS ENUM ('PENDING_PAYMENT', 'PAID', 'IN_PROGRESS', 'FINISHED', 'CANCELLED', 'EXPIRED');
ALTER TABLE "public"."Consultation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Consultation" ALTER COLUMN "status" TYPE "ConsultationStatus_new" USING ("status"::text::"ConsultationStatus_new");
ALTER TYPE "ConsultationStatus" RENAME TO "ConsultationStatus_old";
ALTER TYPE "ConsultationStatus_new" RENAME TO "ConsultationStatus";
DROP TYPE "public"."ConsultationStatus_old";
ALTER TABLE "Consultation" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
COMMIT;

-- AlterTable
ALTER TABLE "Consultation" DROP COLUMN "cost",
ADD COLUMN     "platformFee" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "veterinarianAmount" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';

-- AlterTable
ALTER TABLE "Veterinarian" DROP COLUMN "pricePerConsultation",
ADD COLUMN     "priceChat" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "priceVideo" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "priceVoice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "wompiAccountStatus" "WompiAccountStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "wompiSubaccountId" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "consultationId" INTEGER NOT NULL,
    "wompiTransactionId" TEXT,
    "wompiReference" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "veterinarianAmount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "wompiResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_consultationId_key" ON "Payment"("consultationId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_wompiTransactionId_idx" ON "Payment"("wompiTransactionId");

-- CreateIndex
CREATE INDEX "Consultation_scheduledAt_idx" ON "Consultation"("scheduledAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
