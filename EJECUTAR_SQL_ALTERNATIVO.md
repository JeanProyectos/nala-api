# 🔧 SOLUCIÓN: Ejecutar SQL sin psql

## ❌ Problema: `psql` no está en el PATH

## ✅ SOLUCIONES

### Opción 1: Usar pgAdmin (RECOMENDADO)

1. Abre **pgAdmin 4**
2. Conéctate a tu servidor PostgreSQL
3. Expande: **Servers** → **PostgreSQL** → **Databases** → **nala**
4. Click derecho en **nala** → **Query Tool**
5. Abre el archivo: `prisma/migrations/manual_migration.sql`
6. Copia TODO el contenido
7. Pégalo en el Query Tool
8. Click en **Execute** (F5)

---

### Opción 2: Encontrar psql.exe

Busca `psql.exe` en tu sistema:

```powershell
# Buscar psql.exe
Get-ChildItem -Path "C:\Program Files" -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object FullName

# O buscar en PostgreSQL
Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object FullName
```

Una vez encontrado, usa la ruta completa:

```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d nala -f "prisma\migrations\manual_migration.sql"
```

---

### Opción 3: Usar DBeaver

1. Abre **DBeaver**
2. Conéctate a PostgreSQL → base de datos `nala`
3. Click derecho en la conexión → **SQL Editor** → **New SQL Script**
4. Abre: `prisma/migrations/manual_migration.sql`
5. Ejecuta (Ctrl+Enter o botón Execute)

---

### Opción 4: Usar VS Code con extensión PostgreSQL

1. Instala extensión: **PostgreSQL** (por Chris Kolkman)
2. Conéctate a tu base de datos
3. Abre: `prisma/migrations/manual_migration.sql`
4. Click derecho → **Execute Query**

---

## ✅ DESPUÉS DE EJECUTAR EL SQL

Una vez ejecutado el script SQL correctamente, continúa con:

```powershell
cd "C:\Proyectos Jean Git\nala-api"
npx prisma migrate dev --name add_marketplace_payments
```

---

## 🔍 VERIFICAR QUE FUNCIONÓ

Ejecuta estas queries en tu cliente SQL:

```sql
-- Ver estados de consultas
SELECT status, COUNT(*) FROM "Consultation" GROUP BY status;

-- Ver precios de veterinarios  
SELECT id, "priceChat", "priceVoice", "priceVideo" FROM "Veterinarian" LIMIT 5;

-- Verificar tabla Payment
SELECT COUNT(*) FROM "Payment";
```

**Deberías ver:**
- ✅ Consultas con estados: PENDING_PAYMENT, IN_PROGRESS, FINISHED
- ✅ Veterinarios con priceChat, priceVoice, priceVideo
- ✅ Tabla Payment creada (puede estar vacía)
