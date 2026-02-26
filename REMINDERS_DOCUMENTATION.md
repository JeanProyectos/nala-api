# 📋 Sistema de Recordatorios y Notificaciones Push - Documentación

## 🎯 Resumen

Sistema completo de recordatorios automáticos y notificaciones push para la aplicación NALA.

---

## 🗄️ Base de Datos

### Modelo Reminder

```prisma
model Reminder {
  id            Int           @id @default(autoincrement())
  userId        Int
  petId         Int
  type          ReminderType  // VACCINE, DEWORMING, HEALTH_CHECK
  title         String
  message       String
  scheduledAt   DateTime
  status        ReminderStatus // PENDING, COMPLETED, POSTPONED, SENT
  sent          Boolean        @default(false)
  sentAt        DateTime?
  completedAt   DateTime?
  postponedTo   DateTime?
  relatedId     Int?          // ID del registro relacionado
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}
```

### Campo expoPushToken en User

```prisma
model User {
  expoPushToken String?  // Token para notificaciones push
}
```

---

## ⏰ Cron Jobs

### 1. Generación de Recordatorios
- **Frecuencia**: Diario a las 8:00 AM
- **Zona horaria**: America/Bogota
- **Archivo**: `src/reminders/reminders.scheduler.ts`

**Lógica:**
- Revisa todas las mascotas activas
- **Vacunas**: Crea recordatorios 7 días antes, 1 día antes y el mismo día
- **Desparasitantes**: Crea recordatorios 3 días antes y el mismo día
- **Revisión de salud**: Si no hay registros en 90 días, crea recordatorio

### 2. Envío de Notificaciones
- **Frecuencia**: Cada hora
- **Archivo**: `src/reminders/reminders.scheduler.ts`

**Lógica:**
- Busca recordatorios pendientes que deben enviarse en la próxima hora
- Envía notificación push si el usuario tiene `expoPushToken`
- Marca el recordatorio como `sent: true`

---

## 🔌 Endpoints API

### Recordatorios

#### GET /reminders
Obtiene los recordatorios del usuario autenticado.

**Query Params:**
- `status` (opcional): `PENDING`, `COMPLETED`, `POSTPONED`, `SENT`

**Ejemplo:**
```bash
GET /reminders?status=PENDING
Authorization: Bearer <token>
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "petId": 1,
    "type": "VACCINE",
    "title": "Vacuna próxima: Rabia",
    "message": "A Rocky le toca su vacuna Rabia en 7 días",
    "scheduledAt": "2024-03-01T00:00:00.000Z",
    "status": "PENDING",
    "sent": false,
    "pet": {
      "id": 1,
      "name": "Rocky",
      "photo": "https://..."
    }
  }
]
```

#### PATCH /reminders/:id
Actualiza un recordatorio (marcar como completado, posponer).

**Body:**
```json
{
  "status": "COMPLETED"  // o "POSTPONED"
}
```

**O para posponer:**
```json
{
  "status": "POSTPONED",
  "postponedTo": "2024-03-05"
}
```

#### DELETE /reminders/:id
Elimina un recordatorio.

#### POST /reminders/test (Solo desarrollo)
Genera recordatorios de prueba para el usuario autenticado.

---

### Push Token

#### POST /users/push-token
Registra o actualiza el token de notificaciones push del usuario.

**Body:**
```json
{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Respuesta:**
```json
{
  "id": 1,
  "name": "Juan",
  "email": "juan@example.com",
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

---

## 📱 Frontend (React Native)

### Pantalla de Recordatorios

**Ruta:** `/recordatorios`

**Características:**
- Lista cronológica de recordatorios
- Filtros: Todos / Pendientes
- Acciones: Completar, Posponer, Eliminar
- Indicadores de urgencia por color
- Pull to refresh

### Registro de Token Push

El token se registra automáticamente cuando:
1. El usuario inicia sesión
2. Se solicitan permisos de notificaciones
3. Se obtiene el token de Expo

**Archivo:** `context/NotificationsContext.js`

---

## 🧪 Modo DEBUG / Pruebas

### Generar Recordatorios de Prueba

**Endpoint:** `POST /reminders/test`

**Requisitos:**
- Solo funciona en desarrollo (`NODE_ENV !== 'production'`)
- Usuario autenticado
- Al menos una mascota registrada

**Ejemplo de uso:**
```javascript
// En la app React Native
import * as api from '../services/api';

// Generar recordatorios de prueba
await api.generateTestReminders();
```

### Logs del Backend

Los logs incluyen:
- `🔄 Iniciando generación de recordatorios...`
- `✅ Se crearon X recordatorios`
- `📤 Enviando recordatorios pendientes...`
- `✅ Se enviaron X notificaciones push`

**Ver logs:**
```bash
cd nala-api
npm run start:dev
```

---

## 📦 Payload de Notificación Push

**Ejemplo de payload enviado a Expo:**

```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "sound": "default",
  "title": "Vacuna próxima: Rabia",
  "body": "A Rocky le toca su vacuna Rabia en 7 días",
  "data": {
    "reminderId": 1,
    "petId": 1,
    "petName": "Rocky",
    "type": "VACCINE"
  },
  "priority": "high",
  "channelId": "default"
}
```

---

## 🔧 Configuración

### Variables de Entorno

No se requieren variables adicionales. El sistema usa:
- `DATABASE_URL` (ya configurada)
- Expo Push API (no requiere API key)

### Zona Horaria del Cron

Editar en `src/reminders/reminders.scheduler.ts`:

```typescript
@Cron('0 8 * * *', {
  name: 'generateReminders',
  timeZone: 'America/Bogota', // Cambiar según necesidad
})
```

---

## 🐛 Troubleshooting

### Las notificaciones no se envían

1. Verificar que el usuario tenga `expoPushToken` registrado
2. Verificar permisos de notificaciones en el dispositivo
3. Revisar logs del backend para errores
4. Verificar que el token sea válido (Expo puede invalidar tokens antiguos)

### Los recordatorios no se generan

1. Verificar que el cron job esté corriendo (logs del backend)
2. Verificar que haya mascotas con vacunas/desparasitantes con fechas futuras
3. Verificar que no existan recordatorios duplicados (el sistema evita duplicados)

### Error: "DeviceNotRegistered"

El token ya no es válido. El sistema automáticamente elimina tokens inválidos de la BD.

---

## 📝 Ejemplo de Flujo Completo

1. **Usuario registra una vacuna** con `nextDose: 2024-03-08`
2. **Cron job ejecuta** (8:00 AM del 1 de marzo)
   - Detecta que faltan 7 días → Crea recordatorio
3. **Cron de envío ejecuta** (cada hora)
   - Detecta recordatorio pendiente
   - Envía notificación push al usuario
   - Marca `sent: true`
4. **Usuario abre la app**
   - Ve el recordatorio en la pantalla "Recordatorios"
   - Puede marcarlo como completado o posponerlo

---

## ✅ Checklist de Implementación

- [x] Modelo Reminder en Prisma
- [x] Campo expoPushToken en User
- [x] Migración de base de datos
- [x] Servicio de recordatorios
- [x] Servicio de notificaciones push
- [x] Cron jobs (generación y envío)
- [x] Endpoints API
- [x] Pantalla de recordatorios en React Native
- [x] Registro automático de token push
- [x] Integración en menú
- [x] Manejo de errores
- [x] Logs y debugging

---

**Última actualización:** 2024-02-23
