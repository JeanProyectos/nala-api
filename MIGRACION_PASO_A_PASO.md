# 📋 PASO A PASO - Migración Marketplace Payments

## ⚠️ IMPORTANTE: Lee todo antes de empezar

---

## PASO 1: Ejecutar Script SQL Manual

### Opción A: Usando pgAdmin o DBeaver

1. Abre tu cliente de PostgreSQL (pgAdmin, DBeaver, etc.)
2. Conéctate a la base de datos `nala`
3. Abre el archivo: `prisma/migrations/manual_migration.sql`
4. Ejecuta todo el script SQL
5. Verifica que no haya errores

### Opción B: Usando psql desde terminal

```powershell
# 1. Ir al directorio del proyecto
cd "C:\Proyectos Jean Git\nala-api"

# 2. Ejecutar el script SQL
psql -U postgres -d nala -f "prisma\migrations\manual_migration.sql"
```

**Si te pide contraseña:** Ingresa `postgres` (o la que tengas configurada)

---

## PASO 2: Verificar que los datos se migraron correctamente

Ejecuta estas consultas para verificar:

```sql
-- Verificar que las consultas se migraron
SELECT status, COUNT(*) 
FROM "Consultation" 
GROUP BY status;

-- Deberías ver: PENDING_PAYMENT, IN_PROGRESS, FINISHED, etc.

-- Verificar que los veterinarios tienen priceChat
SELECT id, "priceChat", "priceVoice", "priceVideo" 
FROM "Veterinarian" 
LIMIT 5;

-- Verificar que la tabla Payment existe
SELECT COUNT(*) FROM "Payment";
```

---

## PASO 3: Ejecutar Migración de Prisma

**IMPORTANTE:** Debes ejecutar esto en una terminal interactiva (no desde scripts automatizados)

### En PowerShell o CMD:

```powershell
# 1. Ir al directorio
cd "C:\Proyectos Jean Git\nala-api"

# 2. Ejecutar migración
npx prisma migrate dev --name add_marketplace_payments
```

### Prisma te preguntará:

```
⚠️  Warnings for the current datasource:

  • The values [PENDING,ACTIVE] on the enum `ConsultationStatus` will be removed.
  • You are about to drop the column `pricePerConsultation` on the `Veterinarian` table.

? Are you sure you want to create and apply this migration? (y/n)
```

**Responde: `y` (yes)**

---

## PASO 4: Verificar que todo funcionó

```powershell
# Generar Prisma Client actualizado
npx prisma generate

# Verificar que no hay errores
npm run build
```

---

## PASO 5: Reiniciar el Backend

```powershell
# Detener el servidor si está corriendo (Ctrl+C)
# Luego reiniciar:
npm run start:dev
```

---

## ✅ CHECKLIST FINAL

- [ ] Script SQL manual ejecutado sin errores
- [ ] Datos migrados correctamente (verificar con queries)
- [ ] Migración de Prisma ejecutada
- [ ] Prisma Client regenerado
- [ ] Backend reiniciado sin errores
- [ ] Probar crear una consulta nueva (debe estar en PENDING_PAYMENT)

---

## 🆘 SI HAY ERRORES

### Error: "enum value already exists"
- Ya ejecutaste el script SQL, continúa con el paso 3

### Error: "column does not exist"
- Verifica que ejecutaste el script SQL completo

### Error: "non-interactive environment"
- Ejecuta el comando `npx prisma migrate dev` directamente en tu terminal (no desde scripts)

### Error: "datasource.url is required"
- Verifica que `prisma.config.ts` tiene la URL configurada
- Verifica que el archivo `.env` tiene `DATABASE_URL`

---

## 📞 SIGUIENTE PASO DESPUÉS DE LA MIGRACIÓN

Una vez completada la migración:

1. Agregar variables de Wompi al `.env`:
   ```env
   WOMPI_PUBLIC_KEY=pub_test_xxxxx
   WOMPI_PRIVATE_KEY=prv_test_xxxxx
   WOMPI_INTEGRITY_SECRET=xxxxx
   WOMPI_BASE_URL=https://sandbox.wompi.co/v1
   FRONTEND_URL=http://localhost:8081
   ```

2. Probar el flujo completo:
   - Onboarding de veterinario
   - Crear consulta
   - Crear pago
   - Webhook de Wompi
