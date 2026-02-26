# 🚀 Guía Completa de Configuración - NALA API y App

## 📋 Pasos para Configurar Todo

### Paso 1: Crear el archivo .env

Crea un archivo llamado `.env` en la carpeta `C:\Proyectos Jean Git\nala-api\` con el siguiente contenido:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nala"

# JWT Secret (cambiar en producción)
JWT_SECRET="nala_super_secret_key_change_in_production_2024"

# Puerto del servidor
PORT=3000
```

**⚠️ IMPORTANTE:** Si tu contraseña de PostgreSQL es diferente a "postgres", cámbiala en la línea `DATABASE_URL`.

### Paso 2: Crear la Base de Datos en PostgreSQL

**Opción A: Usando pgAdmin (Recomendado)**

1. Abre pgAdmin 4
2. Conéctate al servidor PostgreSQL (si no lo has hecho)
3. Haz clic derecho en "Databases" → "Create" → "Database"
4. Nombre: `nala`
5. Owner: `postgres`
6. Haz clic en "Save"

**Opción B: Usando SQL en pgAdmin**

1. Abre pgAdmin 4
2. Conéctate al servidor
3. Haz clic derecho en "Databases" → "Query Tool"
4. Ejecuta este SQL:
```sql
CREATE DATABASE nala;
```

### Paso 3: Instalar Dependencias de la API

Abre PowerShell en `C:\Proyectos Jean Git\nala-api\` y ejecuta:

```powershell
npm install
```

### Paso 4: Ejecutar Migraciones de Prisma

Las migraciones crearán todas las tablas en la base de datos:

```powershell
cd "C:\Proyectos Jean Git\nala-api"
npx prisma migrate deploy
```

O si quieres crear una nueva migración desde cero:

```powershell
npx prisma migrate dev --name init
```

### Paso 5: Generar Prisma Client

```powershell
npx prisma generate
```

### Paso 6: Verificar que Todo Funciona

Inicia el servidor de desarrollo:

```powershell
npm run start:dev
```

Deberías ver:
- ✅ `Conectado a PostgreSQL con Prisma`
- 🚀 `API NALA corriendo en http://localhost:3000`

### Paso 7: Configurar la App Móvil

1. Obtén tu IP local:
   ```powershell
   ipconfig
   ```
   Busca "IPv4 Address" (ejemplo: `192.168.1.8`)

2. Edita el archivo `C:\Proyectos Jean Git\nala-app\services\api.js`
   
   Cambia la línea 8:
   ```javascript
   const API_URL = "http://TU_IP_AQUI:3000";
   ```
   
   Por ejemplo, si tu IP es `192.168.1.100`:
   ```javascript
   const API_URL = "http://192.168.1.100:3000";
   ```

### Paso 8: Instalar Dependencias de la App

```powershell
cd "C:\Proyectos Jean Git\nala-app"
npm install
```

### Paso 9: Iniciar la App

```powershell
npm start
```

Escanea el QR code con Expo Go en tu celular.

## ✅ Verificación Final

1. **Backend corriendo:** `http://localhost:3000` debería responder
2. **Base de datos:** En pgAdmin, deberías ver las tablas creadas en la BD `nala`
3. **App conectada:** La app móvil debería poder hacer login/registro

## 🔧 Solución de Problemas

### Error: "DATABASE_URL is not defined"
- Verifica que el archivo `.env` existe en `nala-api`
- Verifica que la ruta de conexión es correcta

### Error: "database does not exist"
- Crea la base de datos `nala` en PostgreSQL (Paso 2)

### Error: "connection refused"
- Verifica que PostgreSQL está corriendo
- Verifica que el puerto 5432 está abierto
- Verifica la contraseña en `.env`

### La app no se conecta al backend
- Verifica que la IP en `services/api.js` es correcta
- Verifica que el backend está corriendo
- Verifica que ambos dispositivos están en la misma red WiFi
- Verifica el firewall de Windows

## 📝 Estructura de la Base de Datos

Después de las migraciones, tendrás estas tablas:
- `User` - Usuarios del sistema
- `Pet` - Mascotas
- `Veterinary` - Veterinarias
- `Appointment` - Citas
- `Vaccine` - Vacunas

## 🎉 ¡Listo!

Ahora tienes todo configurado. Puedes:
- Crear usuarios desde la app
- Agregar mascotas
- Gestionar vacunas y citas
