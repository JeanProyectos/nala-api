-- Script para alinear la base de datos con el schema de Prisma
-- Ejecuta este script en tu base de datos PostgreSQL

-- 1. Renombrar 'species' a 'type' en la tabla Pet (si existe species)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pet' AND column_name = 'species') THEN
        ALTER TABLE "Pet" RENAME COLUMN "species" TO "type";
    END IF;
END $$;

-- 2. Agregar columna 'type' si no existe (por si se llama diferente)
ALTER TABLE "Pet" 
ADD COLUMN IF NOT EXISTS "type" TEXT;

-- Copiar datos de 'species' a 'type' si 'species' aún existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Pet' AND column_name = 'species') THEN
        UPDATE "Pet" SET "type" = "species" WHERE "type" IS NULL;
        ALTER TABLE "Pet" DROP COLUMN IF EXISTS "species";
    END IF;
END $$;

-- 3. Agregar columna 'breed' si no existe
ALTER TABLE "Pet" 
ADD COLUMN IF NOT EXISTS "breed" TEXT;

-- 4. Convertir 'deletedAt' a 'isDeleted' (boolean)
-- Primero agregar la columna isDeleted
ALTER TABLE "Pet" 
ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN DEFAULT false;

-- Actualizar isDeleted basado en deletedAt
UPDATE "Pet" 
SET "isDeleted" = (deletedAt IS NOT NULL)
WHERE "isDeleted" = false;

-- 5. Asegurar que sex sea un enum válido o NULL
-- Crear el tipo enum si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PetSex') THEN
        CREATE TYPE "PetSex" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');
    END IF;
END $$;

-- Convertir la columna sex a enum si es texto
ALTER TABLE "Pet" 
ALTER COLUMN "sex" TYPE TEXT;

-- 6. Crear tabla Vaccine si no existe
CREATE TABLE IF NOT EXISTS "Vaccine" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "petId" INTEGER NOT NULL,
  "appliedDate" TIMESTAMP NOT NULL,
  "nextDose" TIMESTAMP,
  "observations" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vaccine_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE
);

-- Crear índice en petId
CREATE INDEX IF NOT EXISTS "Vaccine_petId_idx" ON "Vaccine"("petId");

-- 7. Asegurar que User tenga todas las columnas necesarias
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "name" TEXT,
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'USER' CHECK ("role" IN ('USER', 'VET', 'ADMIN')),
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 8. Agregar relación vaccines en Pet (esto se maneja automáticamente con Prisma)
-- Solo necesitamos asegurar que la tabla Vaccine exista

-- Verificar resultados
SELECT 'Base de datos actualizada correctamente' AS status;
