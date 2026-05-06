-- Add finance role for settlement payment operations
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FINANCE';

-- Add settlement payment audit fields
ALTER TABLE "VeterinarianSettlement"
ADD COLUMN "paidById" INTEGER,
ADD COLUMN "paymentMethodUsed" TEXT,
ADD COLUMN "paymentReference" TEXT;

CREATE INDEX "VeterinarianSettlement_paidById_idx" ON "VeterinarianSettlement"("paidById");

ALTER TABLE "VeterinarianSettlement"
ADD CONSTRAINT "VeterinarianSettlement_paidById_fkey"
FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
