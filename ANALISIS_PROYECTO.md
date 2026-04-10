# 📊 Análisis Completo del Proyecto NALA API

**Fecha de Análisis:** 2026-03-02  
**Versión del Proyecto:** 0.0.1  
**Framework:** NestJS 11.x  
**Base de Datos:** PostgreSQL con Prisma ORM

---

## 🎯 Propósito del Proyecto

NALA API es el backend de una plataforma completa para el cuidado de mascotas que conecta dueños de mascotas con veterinarios profesionales. La plataforma ofrece:

- **Gestión de mascotas** (registro, historial médico, vacunas, desparasitaciones)
- **Consultas veterinarias** (chat, voz, video) con sistema de pagos integrado
- **Comunidad veterinaria** (foros, casos clínicos, artículos)
- **Recordatorios automáticos** (vacunas, desparasitaciones, chequeos)
- **Sistema de pagos marketplace** (Wompi) con comisiones para la plataforma

---

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **NestJS** | 11.0.1 | Framework principal (Node.js) |
| **TypeScript** | 5.7.3 | Lenguaje de programación |
| **PostgreSQL** | - | Base de datos relacional |
| **Prisma** | 7.2.0 | ORM y gestión de migraciones |
| **Socket.IO** | 4.8.3 | WebSockets para chat en tiempo real |
| **JWT** | 11.0.2 | Autenticación |
| **bcrypt** | 6.0.0 | Encriptación de contraseñas |
| **Multer** | 2.0.2 | Manejo de archivos |
| **Expo Server SDK** | 6.0.0 | Notificaciones push |
| **Axios** | 1.13.5 | Cliente HTTP para APIs externas |

### Estructura de Directorios

```
nala-api/
├── src/
│   ├── auth/              # Autenticación (JWT, login, registro)
│   ├── users/             # Gestión de usuarios
│   ├── pets/              # CRUD de mascotas
│   ├── veterinarians/    # Perfiles de veterinarios
│   ├── consultations/    # Consultas veterinarias
│   ├── chat/              # Gateway WebSocket (Socket.IO)
│   ├── messages/          # Servicio de mensajes
│   ├── vaccines/          # Vacunas de mascotas
│   ├── dewormings/       # Desparasitaciones
│   ├── allergies/         # Alergias
│   ├── health-history/    # Historial médico
│   ├── reminders/        # Recordatorios automáticos
│   ├── notifications/    # Notificaciones push
│   ├── marketplace-payments/  # Integración con Wompi
│   ├── platform-config/  # Configuración de la plataforma
│   ├── community/        # Módulo de comunidad veterinaria
│   ├── upload/           # Subida de archivos
│   ├── prisma/           # Servicio de Prisma
│   └── main.ts           # Punto de entrada
├── prisma/
│   ├── schema.prisma     # Esquema de base de datos
│   └── migrations/       # Migraciones de BD
├── uploads/              # Archivos subidos (imágenes, etc.)
├── dist/                 # Código compilado
└── test/                 # Pruebas
```

---

## 📦 Módulos Principales

### 1. **Auth Module** (`src/auth/`)
- **Propósito:** Autenticación y autorización
- **Características:**
  - Registro de usuarios
  - Login con JWT
  - Guards para proteger rutas
  - Estrategia JWT con Passport
- **Endpoints:**
  - `POST /auth/register` - Registro de usuario
  - `POST /auth/login` - Inicio de sesión

### 2. **Users Module** (`src/users/`)
- **Propósito:** Gestión de usuarios
- **Características:**
  - Perfil de usuario
  - Actualización de datos
  - Roles: USER, VET, ADMIN
- **Endpoints:**
  - `GET /users/me` - Obtener perfil actual
  - `PATCH /users/me` - Actualizar perfil

### 3. **Pets Module** (`src/pets/`)
- **Propósito:** Gestión de mascotas
- **Características:**
  - CRUD completo de mascotas
  - Fotos de mascotas
  - Soft delete
  - Relación con dueño
- **Endpoints:**
  - `GET /pets` - Listar mascotas del usuario
  - `POST /pets` - Crear mascota
  - `GET /pets/:id` - Obtener mascota
  - `PATCH /pets/:id` - Actualizar mascota
  - `DELETE /pets/:id` - Eliminar mascota

### 4. **Veterinarians Module** (`src/veterinarians/`)
- **Propósito:** Gestión de veterinarios
- **Características:**
  - Perfil profesional de veterinarios
  - Especialidades (General, Dermatología, Cirugía, etc.)
  - Precios por tipo de consulta (chat, voz, video)
  - Sistema de calificaciones
  - Estados: PENDING, ACTIVE, INACTIVE, VERIFIED
  - Integración con Wompi para pagos
- **Endpoints:**
  - `GET /veterinarians` - Listar veterinarios
  - `GET /veterinarians/:id` - Obtener veterinario
  - `POST /veterinarians` - Crear perfil (para usuarios VET)
  - `PATCH /veterinarians/:id` - Actualizar perfil

### 5. **Consultations Module** (`src/consultations/`)
- **Propósito:** Gestión de consultas veterinarias
- **Características:**
  - Tipos: CHAT, VOICE, VIDEO
  - Estados: PENDING_PAYMENT, PAID, IN_PROGRESS, FINISHED, CANCELLED, EXPIRED
  - Sistema de precios y comisiones
  - Relación con pagos
- **Endpoints:**
  - `GET /consultations` - Listar consultas
  - `POST /consultations` - Crear consulta
  - `GET /consultations/:id` - Obtener consulta
  - `PATCH /consultations/:id` - Actualizar estado

### 6. **Chat Module** (`src/chat/`)
- **Propósito:** Comunicación en tiempo real
- **Tecnología:** Socket.IO con WebSockets
- **Características:**
  - Chat en tiempo real por consulta
  - Autenticación JWT en WebSocket
  - Soporte para múltiples dispositivos
  - WebRTC para llamadas de voz/video
  - Indicadores de "escribiendo..."
  - Historial de mensajes
  - Reconexión automática
  - Configuración optimizada para Cloudflare Tunnel
- **Eventos WebSocket:**
  - `join_consultation` - Unirse a una consulta
  - `send_message` - Enviar mensaje
  - `typing` - Indicador de escritura
  - `call_request` - Solicitar llamada
  - `call_accept` - Aceptar llamada
  - `call_reject` - Rechazar llamada
  - `call_end` - Terminar llamada
  - `webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate` - WebRTC

### 7. **Marketplace Payments Module** (`src/marketplace-payments/`)
- **Propósito:** Integración con Wompi para pagos
- **Características:**
  - Onboarding de veterinarios en Wompi Marketplace
  - Creación de pagos con división de comisiones
  - Comisión de plataforma configurable (default 15%)
  - Webhooks para actualizar estados de pago
  - Manejo de subcuentas de veterinarios
- **Endpoints:**
  - `POST /marketplace-payments/onboard-veterinarian` - Onboarding
  - `POST /marketplace-payments/create-payment` - Crear pago
  - `POST /marketplace-payments/webhook` - Webhook de Wompi

### 8. **Community Module** (`src/community/`)
- **Propósito:** Comunidad veterinaria
- **Características:**
  - Posts de veterinarios (casos clínicos, foros, artículos)
  - Comentarios anidados
  - Likes y favoritos
  - Sistema de seguimiento (follow/unfollow)
  - Sistema de reportes
  - Reputación de veterinarios
  - Visibilidad: PUBLIC o VETS_ONLY
- **Endpoints:**
  - `GET /community/posts` - Listar posts
  - `POST /community/posts` - Crear post
  - `GET /community/posts/:id` - Obtener post
  - `POST /community/posts/:id/like` - Dar like
  - `POST /community/posts/:id/favorite` - Marcar favorito
  - `POST /community/posts/:id/comments` - Comentar

### 9. **Health Modules**
- **Vaccines** (`src/vaccines/`): Gestión de vacunas
- **Dewormings** (`src/dewormings/`): Desparasitaciones internas/externas
- **Allergies** (`src/allergies/`): Alergias (alimentos, ambientales, medicamentos)
- **Health History** (`src/health-history/`): Historial médico completo

### 10. **Reminders Module** (`src/reminders/`)
- **Propósito:** Recordatorios automáticos
- **Características:**
  - Recordatorios de vacunas, desparasitaciones, chequeos
  - Notificaciones push con Expo
  - Estados: PENDING, COMPLETED, POSTPONED, SENT
  - Programación con `@nestjs/schedule`

### 11. **Notifications Module** (`src/notifications/`)
- **Propósito:** Notificaciones push
- **Características:**
  - Integración con Expo Push Notifications
  - Tokens de dispositivos
  - Envío de notificaciones personalizadas

### 12. **Upload Module** (`src/upload/`)
- **Propósito:** Subida de archivos
- **Características:**
  - Subida de imágenes (mascotas, veterinarios, posts)
  - Servicio de archivos estáticos en `/uploads`
  - Validación de tipos de archivo

### 13. **Platform Config Module** (`src/platform-config/`)
- **Propósito:** Configuración de la plataforma
- **Características:**
  - Porcentaje de comisión configurable
  - Gestión por administradores

---

## 🗄️ Modelo de Datos (Prisma Schema)

### Entidades Principales

#### **User**
- Información básica del usuario
- Roles: USER, VET, ADMIN
- Token Expo para notificaciones push
- Relación con Veterinarian (opcional)

#### **Pet**
- Información de mascotas
- Especies: DOG, CAT, BIRD, RABBIT, REPTILE, EXOTIC, OTHER
- Relaciones con vacunas, desparasitaciones, alergias, historial médico

#### **Veterinarian**
- Perfil profesional completo
- Especialidades, experiencia, idiomas
- Precios por tipo de consulta
- Integración con Wompi (subcuenta)
- Sistema de calificaciones y reputación

#### **Consultation**
- Consultas entre usuario y veterinario
- Tipos: CHAT, VOICE, VIDEO
- Estados de pago y progreso
- Cálculo de comisiones

#### **Payment**
- Pagos procesados por Wompi
- División de montos (plataforma + veterinario)
- Estados: PENDING, APPROVED, DECLINED, ERROR

#### **Message**
- Mensajes de chat en consultas
- Tipo de remitente (user/vet)
- Índices para búsqueda rápida

#### **CommunityPost**
- Posts de la comunidad veterinaria
- Tipos: CLINICAL_CASE, FORUM_DISCUSSION, ARTICLE
- Detalles específicos por tipo
- Sistema de moderación (reports)

#### **Reminder**
- Recordatorios programados
- Tipos: VACCINE, DEWORMING, HEALTH_CHECK
- Estados y fechas de envío

### Relaciones Clave

```
User 1:1 Veterinarian (opcional)
User 1:N Pet
Pet 1:N Vaccine, Deworming, Allergy, HealthHistory
Consultation N:1 User, Veterinarian
Consultation 1:1 Payment
Consultation 1:N Message
Veterinarian 1:N CommunityPost
CommunityPost 1:N Comment, PostLike, PostFavorite
```

---

## 🔐 Seguridad

### Autenticación
- **JWT Tokens** con expiración configurable
- **Passport.js** para estrategias de autenticación
- **Guards** para proteger rutas

### Autorización
- **Roles:** USER, VET, ADMIN
- **Guards personalizados** para validar permisos
- **Validación de propiedad** (usuarios solo ven sus mascotas)

### Validación
- **class-validator** para DTOs
- **ValidationPipe global** con whitelist
- **Transformación automática** de tipos

### CORS
- Configuración flexible según entorno
- Desarrollo: permite todos los origins
- Producción: solo origins permitidos en `ALLOWED_ORIGINS`

### Encriptación
- **bcrypt** para contraseñas
- **JWT** para tokens seguros

---

## 🌐 Configuración de Producción

### Despliegue
- **IIS** (Internet Information Services) en Windows
- **Cloudflare Tunnel** para acceso público
- **Scripts PowerShell** para automatización

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/nala"

# Autenticación
JWT_SECRET="secret_key_production"

# Servidor
PORT=3000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://nala-api.patasypelos.xyz,https://patasypelos.xyz
BASE_URL=https://nala-api.patasypelos.xyz

# Wompi (opcional)
WOMPI_PUBLIC_KEY=""
WOMPI_PRIVATE_KEY=""
WOMPI_WEBHOOK_SECRET=""
```

### WebSockets en Producción
- Configuración optimizada para Cloudflare Tunnel
- `pingTimeout: 60000` (requerido por Cloudflare)
- `pingInterval: 25000`
- Soporte para `wss://` (WebSocket Secure)

---

## 📝 Características Destacadas

### ✅ Implementadas

1. **Sistema de autenticación completo** con JWT
2. **CRUD completo** de mascotas y usuarios
3. **WebSockets** para chat en tiempo real
4. **Sistema de pagos** con Wompi Marketplace
5. **Comunidad veterinaria** con posts, comentarios, likes
6. **Recordatorios automáticos** con notificaciones push
7. **Historial médico completo** (vacunas, desparasitaciones, alergias)
8. **Sistema de calificaciones** para veterinarios
9. **WebRTC** para llamadas de voz/video
10. **Subida de archivos** con Multer
11. **Soft delete** en entidades principales
12. **Sistema de reportes** para moderación

### 🔄 En Desarrollo / Mejoras Futuras

1. **Tests automatizados** (estructura básica presente)
2. **Documentación API** (Swagger/OpenAPI)
3. **Rate limiting** para prevenir abusos
4. **Caché** con Redis (opcional)
5. **Logging avanzado** con Winston/Pino
6. **Métricas y monitoreo** (Prometheus, Grafana)
7. **Backup automático** de base de datos
8. **Sistema de facturación** para veterinarios

---

## 🐛 Problemas Conocidos / Áreas de Mejora

### Seguridad
- ⚠️ `JWT_SECRET` debe cambiarse en producción
- ⚠️ Considerar implementar rate limiting
- ⚠️ Validar tamaño máximo de archivos subidos

### Performance
- ⚠️ Considerar índices adicionales en consultas frecuentes
- ⚠️ Implementar paginación en endpoints de listado
- ⚠️ Optimizar queries con `include` anidados

### Código
- ⚠️ Algunos servicios podrían beneficiarse de más validaciones
- ⚠️ Manejo de errores podría ser más específico en algunos casos
- ⚠️ Considerar DTOs más específicos para respuestas

### Documentación
- ⚠️ Falta documentación API (Swagger)
- ⚠️ Algunos módulos tienen documentación mínima en código

---

## 📊 Estadísticas del Proyecto

- **Módulos principales:** 13+
- **Modelos de datos:** 20+
- **Endpoints REST:** ~50+
- **Eventos WebSocket:** 10+
- **Migraciones de BD:** 8+
- **Scripts de despliegue:** 10+

---

## 🚀 Comandos Útiles

### Desarrollo
```bash
# Instalar dependencias
npm install

# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar en desarrollo
npm run start:dev

# Build para producción
npm run build:prod
```

### Producción
```bash
# Iniciar en producción
npm run start:prod

# Verificar configuración IIS
.\verificar-configuracion-iis.ps1

# Publicar en wwwroot
.\publicar-en-wwwroot.ps1
```

---

## 📚 Documentación Adicional

El proyecto incluye extensa documentación en Markdown:

- `README.md` - Guía básica
- `GUIA_PRUEBAS_WEBSOCKETS.md` - Pruebas de WebSockets
- `MARKETPLACE_IMPLEMENTATION.md` - Implementación de pagos
- `PUBLICACION_IIS.md` - Despliegue en IIS
- `CONFIGURAR_ENV.md` - Configuración de variables de entorno
- Y muchos más archivos de documentación específica

---

## 🎯 Conclusión

NALA API es un proyecto **bien estructurado** y **completo** que implementa una plataforma robusta para el cuidado de mascotas. El código sigue buenas prácticas de NestJS, utiliza TypeScript para type safety, y tiene una arquitectura modular que facilita el mantenimiento.

**Fortalezas:**
- ✅ Arquitectura modular y escalable
- ✅ TypeScript para type safety
- ✅ Prisma para gestión de BD
- ✅ WebSockets bien implementados
- ✅ Sistema de pagos integrado
- ✅ Documentación extensa

**Áreas de mejora:**
- ⚠️ Tests automatizados
- ⚠️ Documentación API (Swagger)
- ⚠️ Rate limiting y seguridad adicional
- ⚠️ Optimización de queries

---

**Última actualización:** 2026-03-02
