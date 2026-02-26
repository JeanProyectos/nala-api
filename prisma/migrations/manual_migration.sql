-- Migración manual para Marketplace Payments
-- Ejecutar este script ANTES de aplicar la migración de Prisma

-- IMPORTANTE: Este script debe ejecutarse en orden
-- Si hay errores, detente y revisa

-- 1. PRIMERO: Agregar nuevos valores al enum ConsultationStatus
-- (PostgreSQL requiere que los valores existan antes de usarlos)
DO $$ 
BEGIN
    -- Agregar nuevos valores al enum si no existen
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING_PAYMENT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ConsultationStatus')) THEN
        ALTER TYPE "ConsultationStatus" ADD VALUE 'PENDING_PAYMENT';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PAID' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ConsultationStatus')) THEN
        ALTER TYPE "ConsultationStatus" ADD VALUE 'PAID';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'IN_PROGRESS' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ConsultationStatus')) THEN
        ALTER TYPE "ConsultationStatus" ADD VALUE 'IN_PROGRESS';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EXPIRED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ConsultationStatus')) THEN
        ALTER TYPE "ConsultationStatus" ADD VALUE 'EXPIRED';
    END IF;
END $$;

-- 2. AHORA SÍ: Migrar valores del enum ConsultationStatus
-- PENDING -> PENDING_PAYMENT
-- ACTIVE -> IN_PROGRESS
UPDATE "Consultation" 
SET status = 'PENDING_PAYMENT'::"ConsultationStatus"
WHERE status = 'PENDING'::"ConsultationStatus";

UPDATE "Consultation" 
SET status = 'IN_PROGRESS'::"ConsultationStatus"
WHERE status = 'ACTIVE'::"ConsultationStatus";

-- 3. Migrar pricePerConsultation a priceChat
UPDATE "Veterinarian" 
SET "priceChat" = "pricePerConsultation" 
WHERE "pricePerConsultation" IS NOT NULL AND "priceChat" = 0;

-- 4. Agregar nuevos campos a Consultation (si no existen)
ALTER TABLE "Consultation" 
ADD COLUMN IF NOT EXISTS "price" FLOAT,
ADD COLUMN IF NOT EXISTS "platformFee" FLOAT,
ADD COLUMN IF NOT EXISTS "veterinarianAmount" FLOAT,
ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP;

-- 5. Calcular valores para consultas existentes
UPDATE "Consultation" c
SET 
  "price" = COALESCE(c."cost", 0),
  "platformFee" = COALESCE(c."cost", 0) * 0.15,
  "veterinarianAmount" = COALESCE(c."cost", 0) * 0.85
WHERE c."price" IS NULL;

-- 6. Agregar nuevos campos a Veterinarian (si no existen)
ALTER TABLE "Veterinarian"
ADD COLUMN IF NOT EXISTS "priceVoice" FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS "priceVideo" FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS "wompiSubaccountId" TEXT,
ADD COLUMN IF NOT EXISTS "wompiAccountStatus" TEXT DEFAULT 'PENDING';

-- 7. Crear tabla Payment
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" SERIAL PRIMARY KEY,
  "consultationId" INTEGER UNIQUE NOT NULL,
  "wompiTransactionId" TEXT,
  "wompiReference" TEXT,
  "amount" FLOAT NOT NULL,
  "platformFee" FLOAT NOT NULL,
  "veterinarianAmount" FLOAT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "paymentMethod" TEXT,
  "wompiResponse" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_wompiTransactionId_idx" ON "Payment"("wompiTransactionId");

-- 8. Verificar migración
-- Ejecuta estas queries para verificar que todo está correcto:

-- SELECT status, COUNT(*) FROM "Consultation" GROUP BY status;
-- SELECT id, "priceChat", "priceVoice", "priceVideo" FROM "Veterinarian" LIMIT 5;
-- SELECT COUNT(*) FROM "Payment";

-- Si todo está bien, continúa con: npx prisma migrate dev --name add_marketplace_payments
