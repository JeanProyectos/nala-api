-- AlterEnum
-- Agregar nuevos valores al enum ConsultationStatus
DO $$ BEGIN
 CREATE TYPE "ConsultationStatus_new" AS ENUM ('PENDING_PAYMENT', 'PENDING_APPROVAL', 'PAID', 'IN_PROGRESS', 'FINISHED', 'CANCELLED', 'REJECTED', 'EXPIRED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Migrar datos existentes
ALTER TABLE "Consultation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Consultation" ALTER COLUMN "status" TYPE "ConsultationStatus_new" USING ("status"::text::"ConsultationStatus_new");

-- Eliminar enum antiguo y renombrar el nuevo
DROP TYPE "ConsultationStatus";
ALTER TYPE "ConsultationStatus_new" RENAME TO "ConsultationStatus";

-- Restaurar default
ALTER TABLE "Consultation" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
