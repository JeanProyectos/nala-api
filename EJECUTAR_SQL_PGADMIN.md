# 🎯 EJECUTAR SQL CON PGADMIN (MÁS FÁCIL)

## ✅ PASO A PASO DETALLADO

### 1️⃣ Abrir pgAdmin

1. Busca **pgAdmin 4** en el menú de inicio
2. Ábrelo (puede pedirte la contraseña maestra de pgAdmin)

---

### 2️⃣ Conectarte a PostgreSQL

1. En el panel izquierdo, expande: **Servers**
2. Si ya tienes un servidor configurado, expande: **PostgreSQL** (o el nombre de tu servidor)
3. Si NO tienes servidor configurado:
   - Click derecho en **Servers** → **Register** → **Server**
   - En la pestaña **General**:
     - Name: `PostgreSQL` (o cualquier nombre)
   - En la pestaña **Connection**:
     - Host: `localhost`
     - Port: `5432`
     - Database: `postgres`
     - Username: `postgres`
     - Password: `postgres` (o la que tengas)
   - Click **Save**

---

### 3️⃣ Abrir Query Tool

1. Expande: **Servers** → **PostgreSQL** → **Databases** → **nala**
2. Click derecho en **nala** → **Query Tool**
   - O simplemente selecciona **nala** y presiona **Alt+Shift+Q**

---

### 4️⃣ Ejecutar el Script SQL

1. En el Query Tool, click en el botón **Open File** (📁) o presiona **Ctrl+O**
2. Navega a: `C:\Proyectos Jean Git\nala-api\prisma\migrations\`
3. Selecciona: `manual_migration.sql`
4. Click **Open**

**O alternativamente:**
1. Abre el archivo `manual_migration.sql` en Notepad o VS Code
2. Copia TODO el contenido (Ctrl+A, Ctrl+C)
3. Pégalo en el Query Tool (Ctrl+V)

---

### 5️⃣ Ejecutar el Script

1. Click en el botón **Execute** (▶️) o presiona **F5**
2. Espera a que termine (verás mensajes en la parte inferior)
3. Deberías ver: **"Query returned successfully"** o similar

---

### 6️⃣ Verificar que Funcionó

Ejecuta estas queries una por una en el Query Tool:

```sql
-- Ver estados de consultas
SELECT status, COUNT(*) FROM "Consultation" GROUP BY status;
```

**Deberías ver:** PENDING_PAYMENT, IN_PROGRESS, FINISHED, etc. (NO debería haber PENDING ni ACTIVE)

```sql
-- Ver precios de veterinarios
SELECT id, "priceChat", "priceVoice", "priceVideo" FROM "Veterinarian" LIMIT 5;
```

**Deberías ver:** Veterinarios con valores en priceChat, priceVoice, priceVideo

```sql
-- Verificar tabla Payment
SELECT COUNT(*) FROM "Payment";
```

**Deberías ver:** Un número (puede ser 0, es normal si no hay pagos aún)

---

## ✅ Si Todo Está Bien

Continúa con la migración de Prisma:

```powershell
cd "C:\Proyectos Jean Git\nala-api"
npx prisma migrate dev --name add_marketplace_payments
```

Cuando pregunte, responde: `y`

---

## 🆘 Si Hay Errores

### Error: "relation already exists"
✅ **OK** - La tabla ya existe, continúa

### Error: "enum value already exists"
✅ **OK** - El valor ya existe, continúa

### Error: "column does not exist"
❌ Verifica que ejecutaste TODO el script SQL completo

### Error: "syntax error"
❌ Copia el script completo de nuevo, puede haber faltado algo

---

## 📸 Capturas de Pantalla (Referencia)

**Query Tool en pgAdmin:**
- Panel superior: Editor SQL
- Panel inferior: Resultados y mensajes
- Botón Execute: ▶️ (arriba a la derecha)

---

## 🎯 RESUMEN RÁPIDO

1. Abre pgAdmin
2. Conéctate a PostgreSQL → base de datos `nala`
3. Click derecho en `nala` → **Query Tool**
4. Abre `manual_migration.sql` o copia su contenido
5. Ejecuta (F5)
6. Verifica con las queries
7. Continúa con Prisma migrate

**¡Es más fácil que buscar psql! 🚀**
