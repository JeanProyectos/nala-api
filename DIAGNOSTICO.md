# 🔍 Diagnóstico de Error 500

## Pasos para diagnosticar y solucionar

### 1. Verificar que el backend esté corriendo

```bash
cd C:\nala-api
npm run start:dev
```

Deberías ver:
- `🚀 API NALA corriendo en http://localhost:3000`
- `✅ Conectado a la base de datos`

### 2. Verificar la base de datos

**A. Verificar que PostgreSQL esté corriendo:**
- Abre Services en Windows
- Busca "postgresql" y verifica que esté "Running"

**B. Verificar el archivo .env:**
Crea o verifica que existe `C:\nala-api\.env` con:

```env
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/nala"
JWT_SECRET="nala_super_secret_key_change_in_production"
PORT=3000
```

**C. Crear la base de datos:**
```sql
CREATE DATABASE nala;
```

**D. Ejecutar migraciones:**
```bash
cd C:\nala-api
npx prisma migrate dev --name init
```

**E. Generar Prisma Client:**
```bash
npx prisma generate
```

### 3. Verificar la IP en la app móvil

Abre `C:\nala\services\api.js` y verifica que la IP sea correcta:

```javascript
const API_URL = "http://TU_IP:3000";
```

Para obtener tu IP:
```powershell
ipconfig
```
Busca "IPv4 Address"

### 4. Verificar que ambos estén en la misma red

- Tu celular y computadora deben estar en la misma red WiFi
- No uses datos móviles en el celular

### 5. Verificar el firewall de Windows

El puerto 3000 debe estar abierto:
- Windows Defender Firewall → Configuración avanzada
- Reglas de entrada → Permitir puerto 3000

### 6. Probar la API directamente

Desde el navegador del celular, intenta acceder a:
```
http://TU_IP:3000
```

Deberías ver "Hello World!" (del controlador por defecto)

### 7. Ver los logs del backend

Cuando hagas una petición desde la app, revisa la terminal del backend para ver el error específico.

## Errores comunes:

### Error: "Can't reach database server"
- PostgreSQL no está corriendo
- DATABASE_URL incorrecto
- La base de datos no existe

### Error: "PrismaClient is not generated"
```bash
npx prisma generate
```

### Error: "Connection refused"
- El backend no está corriendo
- La IP es incorrecta
- Firewall bloqueando

### Error: "CORS"
- Ya está configurado, pero verifica que el backend esté corriendo

## Comandos útiles:

```bash
# Verificar Prisma
npx prisma studio  # Abre interfaz visual de la BD

# Reiniciar todo
cd C:\nala-api
npm run start:dev

# Ver logs en tiempo real
# Los errores aparecerán en la terminal donde corre el backend
```

