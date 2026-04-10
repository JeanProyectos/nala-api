-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'IN_CONSULTATION', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "Veterinarian" ADD COLUMN "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE';
