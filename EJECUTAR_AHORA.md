# ✅ SCRIPT LISTO - EJECUTAR AHORA

## 🚀 PASOS RÁPIDOS

### 1️⃣ Ejecutar Script SQL

**Opción A: pgAdmin / DBeaver**
- Abre tu cliente PostgreSQL
- Conéctate a base de datos: `nala`
- Abre archivo: `prisma/migrations/manual_migration.sql`
- Ejecuta todo (F5 o botón Execute)

**Opción B: Terminal**
```powershell
cd "C:\Proyectos Jean Git\nala-api"
psql -U postgres -d nala -f "prisma\migrations\manual_migration.sql"
```
Contraseña: `postgres` (o la que tengas)

---

### 2️⃣ Verificar que funcionó

Ejecuta estas queries en tu cliente SQL:

```sql
-- Ver estados de consultas
SELECT status, COUNT(*) FROM "Consultation" GROUP BY status;

-- Ver precios de veterinarios
SELECT id, "priceChat", "priceVoice", "priceVideo" FROM "Veterinarian" LIMIT 5;

-- Verificar tabla Payment
SELECT COUNT(*) FROM "Payment";
```

**✅ Deberías ver:**
- Consultas con estados: PENDING_PAYMENT, IN_PROGRESS, FINISHED, etc.
- Veterinarios con priceChat, priceVoice, priceVideo
- Tabla Payment creada (puede estar vacía, es normal)

---

### 3️⃣ Ejecutar Migración de Prisma

**IMPORTANTE:** Ejecuta esto en tu terminal (PowerShell o CMD), NO desde scripts automatizados.

```powershell
cd "C:\Proyectos Jean Git\nala-api"
npx prisma migrate dev --name add_marketplace_payments
```

**Cuando pregunte:**
```
⚠️  Warnings for the current datasource:
  • The values [PENDING,ACTIVE] on the enum `ConsultationStatus` will be removed.
  • You are about to drop the column `pricePerConsultation` on the `Veterinarian` table.

? Are you sure you want to create and apply this migration? (y/n)
```

**Responde: `y`** (yes)

---

### 4️⃣ Regenerar Prisma Client

```powershell
npx prisma generate
```

---

### 5️⃣ Reiniciar Backend

```powershell
# Detener servidor si está corriendo (Ctrl+C)
npm run start:dev
```

---

## ✅ CHECKLIST

- [ ] Script SQL ejecutado sin errores
- [ ] Queries de verificación muestran datos correctos
- [ ] Migración de Prisma ejecutada (respondiste 'y')
- [ ] Prisma Client regenerado
- [ ] Backend reiniciado sin errores

---

## 🆘 SI HAY ERRORES

### Error: "enum value already exists"
✅ **OK** - Ya se ejecutó antes, continúa con paso 3

### Error: "column does not exist"
❌ Verifica que ejecutaste TODO el script SQL completo

### Error: "non-interactive environment"
❌ Ejecuta `npx prisma migrate dev` directamente en tu terminal (no desde scripts)

### Error: "relation already exists"
✅ **OK** - La tabla Payment ya existe, continúa con paso 3

---

## 🎯 SIGUIENTE PASO DESPUÉS DE TODO

Una vez completado, agrega estas variables al `.env`:

```env
WOMPI_PUBLIC_KEY=pub_test_xxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxx
WOMPI_INTEGRITY_SECRET=xxxxx
WOMPI_BASE_URL=https://sandbox.wompi.co/v1
FRONTEND_URL=http://localhost:8081
```

---

## 📝 RESUMEN

1. **Ejecuta SQL** → `manual_migration.sql`
2. **Verifica** → Queries de verificación
3. **Migra Prisma** → `npx prisma migrate dev`
4. **Regenera** → `npx prisma generate`
5. **Reinicia** → `npm run start:dev`

**¡Listo para empezar! 🚀**
