# 🔧 Configuración del archivo .env

## Pasos para configurar:

### 1. Crear/Editar el archivo `.env` en `C:\nala-api\.env`

**Opción A: Si PostgreSQL tiene contraseña:**
```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD_AQUI@localhost:5432/nala"
JWT_SECRET="nala_super_secret_key_change_in_production"
PORT=3000
```

**Opción B: Si PostgreSQL NO tiene contraseña (instalación por defecto):**
```env
DATABASE_URL="postgresql://postgres@localhost:5432/nala"
JWT_SECRET="nala_super_secret_key_change_in_production"
PORT=3000
```

### 2. Reemplazar `TU_PASSWORD_AQUI` con tu contraseña real de PostgreSQL

Si no recuerdas la contraseña:
- Busca en la instalación de PostgreSQL
- O usa la contraseña que configuraste al instalar PostgreSQL
- Si no tienes contraseña, usa la Opción B

### 3. Crear la base de datos (si no existe)

Abre pgAdmin o psql y ejecuta:
```sql
CREATE DATABASE nala;
```

O desde PowerShell:
```powershell
psql -U postgres -c "CREATE DATABASE nala;"
```

### 4. Ejecutar migraciones

```powershell
cd C:\nala-api
npx prisma migrate dev --name init
```

### 5. Generar Prisma Client

```powershell
npx prisma generate
```

### 6. Iniciar el backend

```powershell
npm run start:dev
```

## Ejemplo de .env completo:

```env
DATABASE_URL="postgresql://postgres:mi_password_123@localhost:5432/nala"
JWT_SECRET="nala_super_secret_key_change_in_production_12345"
PORT=3000
```

## Verificar que funciona:

Después de configurar, deberías ver en la terminal:
- `✅ Conectado a la base de datos`
- `🚀 API NALA corriendo en http://localhost:3000`



