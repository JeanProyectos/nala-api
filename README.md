# 🐾 NALA API - Backend con NestJS

API REST profesional para la aplicación NALA (app de cuidado de mascotas).

## 🚀 Inicio Rápido

### 1. Configurar Base de Datos

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/nala"
JWT_SECRET="nala_super_secret_key_change_in_production"
PORT=3000
```

### 2. Configurar PostgreSQL

Asegúrate de tener PostgreSQL instalado y crea la base de datos:

```sql
CREATE DATABASE nala;
```

### 3. Ejecutar Migraciones

```bash
npx prisma migrate dev --name init
```

### 4. Iniciar el Servidor

```bash
npm run start:dev
```

La API estará disponible en `http://localhost:3000`

## 📚 Endpoints

### Auth (Sin autenticación)

#### POST `/auth/register`
Registra un nuevo usuario.

**Body:**
```json
{
  "email": "test@nala.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "test@nala.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/auth/login`
Inicia sesión.

**Body:**
```json
{
  "email": "test@nala.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "test@nala.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Users (Requiere JWT)

#### GET `/users/me`
Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

### Pets (Requiere JWT)

#### POST `/pets`
Crea una nueva mascota.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Max",
  "species": "Perro",
  "age": 3,
  "weight": 15.5
}
```

#### GET `/pets`
Obtiene todas las mascotas del usuario.

**Headers:**
```
Authorization: Bearer <token>
```

#### GET `/pets/:id`
Obtiene una mascota por ID.

#### PATCH `/pets/:id`
Actualiza una mascota.

**Body:**
```json
{
  "name": "Max",
  "age": 4
}
```

#### DELETE `/pets/:id`
Elimina una mascota.

## 🧪 Probar la API

### Con Postman o Thunder Client

1. **Registro:**
   - POST `http://localhost:3000/auth/register`
   - Body: `{ "email": "test@nala.com", "password": "123456" }`
   - Guarda el `token` de la respuesta

2. **Login:**
   - POST `http://localhost:3000/auth/login`
   - Body: `{ "email": "test@nala.com", "password": "123456" }`
   - Guarda el `token` de la respuesta

3. **Obtener Perfil:**
   - GET `http://localhost:3000/users/me`
   - Headers: `Authorization: Bearer <token>`

4. **Crear Mascota:**
   - POST `http://localhost:3000/pets`
   - Headers: `Authorization: Bearer <token>`
   - Body: `{ "name": "Max", "species": "Perro", "age": 3, "weight": 15.5 }`

## 📱 Conectar con la App Móvil

En tu app Expo (`nala`), crea un servicio API:

```typescript
// src/services/api.ts
const API_URL = "http://TU_IP_LOCAL:3000";

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}
```

**⚠️ IMPORTANTE:** Si usas celular físico, usa tu IP local (ej: `http://192.168.1.8:3000`) en lugar de `localhost`.

## 🏗️ Estructura del Proyecto

```
nala-api/
├── src/
│   ├── auth/          # Autenticación (register, login, JWT)
│   ├── users/          # Gestión de usuarios
│   ├── pets/           # CRUD de mascotas
│   ├── prisma/         # Servicio de Prisma
│   └── main.ts         # Punto de entrada
├── prisma/
│   └── schema.prisma   # Esquema de base de datos
└── .env                # Variables de entorno
```

## 🔒 Seguridad

- Passwords encriptados con bcrypt
- JWT para autenticación
- Validación de DTOs con class-validator
- CORS habilitado para desarrollo

## 📝 Notas

- El token JWT expira en 7 días
- Todas las rutas de `/pets` y `/users` requieren autenticación
- Cada usuario solo puede ver/editar sus propias mascotas
