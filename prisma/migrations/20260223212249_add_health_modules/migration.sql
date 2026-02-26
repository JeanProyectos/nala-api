/*
  Warnings:

  - The `sex` column on the `Pet` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DewormingType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "AllergyType" AS ENUM ('FOOD', 'ENVIRONMENTAL', 'MEDICATION');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('MILD', 'MODERATE', 'SEVERE');

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "color" TEXT,
ADD COLUMN     "photo" TEXT,
DROP COLUMN "sex",
ADD COLUMN     "sex" "PetSex" DEFAULT 'UNKNOWN';

-- AlterTable
ALTER TABLE "Vaccine" ADD COLUMN     "veterinary" TEXT;

-- CreateTable
CREATE TABLE "Deworming" (
    "id" SERIAL NOT NULL,
    "type" "DewormingType" NOT NULL,
    "product" TEXT NOT NULL,
    "petId" INTEGER NOT NULL,
    "appliedDate" TIMESTAMP(3) NOT NULL,
    "nextDate" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deworming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" SERIAL NOT NULL,
    "type" "AllergyType" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "SeverityLevel" NOT NULL,
    "petId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthHistory" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "medications" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "veterinarian" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deworming_petId_idx" ON "Deworming"("petId");

-- CreateIndex
CREATE INDEX "Allergy_petId_idx" ON "Allergy"("petId");

-- CreateIndex
CREATE INDEX "HealthHistory_petId_idx" ON "HealthHistory"("petId");

-- AddForeignKey
ALTER TABLE "Deworming" ADD CONSTRAINT "Deworming_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHistory" ADD CONSTRAINT "HealthHistory_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
