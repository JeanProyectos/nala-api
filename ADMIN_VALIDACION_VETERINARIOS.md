# 👨‍💼 SISTEMA DE VALIDACIÓN DE VETERINARIOS POR ADMIN

## ✅ IMPLEMENTADO

### Endpoints para Admin

#### 1. **Listar Veterinarios Pendientes**
```
GET /veterinarians/admin/pending
Authorization: Bearer <JWT_TOKEN_ADMIN>
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "fullName": "Dr. Juan Pérez",
    "country": "Colombia",
    "city": "Bogotá",
    "specialty": "GENERAL",
    "yearsExperience": 5,
    "status": "PENDING",
    "user": {
      "id": 10,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "+573001234567"
    },
    "_count": {
      "consultations": 0,
      "ratings": 0
    },
    "createdAt": "2026-02-24T12:00:00Z"
  }
]
```

---

#### 2. **Aprobar Veterinario**
```
PUT /veterinarians/admin/:id/verify
Authorization: Bearer <JWT_TOKEN_ADMIN>
Content-Type: application/json

{
  "status": "VERIFIED",
  "notes": "Documentos verificados correctamente"
}
```

**Respuesta:**
```json
{
  "id": 1,
  "fullName": "Dr. Juan Pérez",
  "status": "VERIFIED",
  "user": {
    "id": 10,
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

---

#### 3. **Rechazar Veterinario**
```
PUT /veterinarians/admin/:id/verify
Authorization: Bearer <JWT_TOKEN_ADMIN>
Content-Type: application/json

{
  "status": "INACTIVE",
  "notes": "Documentos no válidos o incompletos"
}
```

---

## 🔐 SEGURIDAD

- ✅ Solo usuarios con rol `ADMIN` pueden acceder
- ✅ Validación con `JwtAuthGuard` + `RolesGuard`
- ✅ Solo veterinarios en estado `PENDING` pueden ser verificados

---

## 📋 FLUJO COMPLETO

### 1. Veterinario se Registra
```
POST /auth/register
{
  "email": "vet@example.com",
  "password": "password123",
  "role": "VET"
}
```

### 2. Veterinario Completa Perfil
```
POST /veterinarians
{
  "fullName": "Dr. Juan Pérez",
  "country": "Colombia",
  "city": "Bogotá",
  "specialty": "GENERAL",
  "yearsExperience": 5,
  "priceChat": 50000,
  "priceVoice": 80000,
  "priceVideo": 100000
}
```
**Status:** `PENDING` (automático)

### 3. Admin Revisa Pendientes
```
GET /veterinarians/admin/pending
```
Ve lista de todos los veterinarios esperando aprobación

### 4. Admin Aprueba/Rechaza
```
PUT /veterinarians/admin/1/verify
{
  "status": "VERIFIED",  // o "INACTIVE" para rechazar
  "notes": "Documentos verificados"
}
```

### 5. Veterinario Puede Recibir Consultas
- Si `VERIFIED` → Aparece en búsqueda, puede recibir consultas
- Si `INACTIVE` → No aparece, no puede recibir consultas

---

## 🧪 PROBAR CON POSTMAN

### Crear Usuario Admin

Primero necesitas un usuario con rol `ADMIN`. Puedes:

**Opción A: Directamente en la base de datos**
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'tu-email@example.com';
```

**Opción B: Crear endpoint temporal (solo desarrollo)**
```typescript
// Agregar temporalmente en auth.controller.ts
@Post('create-admin')
async createAdmin(@Body() dto: RegisterDto) {
  // ... código de registro pero forzando role = ADMIN
}
```

### Probar Endpoints

1. **Login como Admin:**
```
POST http://localhost:3000/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

2. **Listar Pendientes:**
```
GET http://localhost:3000/veterinarians/admin/pending
Authorization: Bearer <token_del_admin>
```

3. **Aprobar Veterinario:**
```
PUT http://localhost:3000/veterinarians/admin/1/verify
Authorization: Bearer <token_del_admin>
Content-Type: application/json

{
  "status": "VERIFIED",
  "notes": "Aprobado"
}
```

---

## 📝 ESTADOS DE VETERINARIO

- `PENDING` - Esperando verificación (no puede recibir consultas)
- `ACTIVE` - Activo (puede recibir consultas)
- `VERIFIED` - Verificado por admin (puede recibir consultas)
- `INACTIVE` - Rechazado o desactivado (no puede recibir consultas)

---

## 🔄 MEJORAS FUTURAS (Opcionales)

### 1. Agregar Campos de Verificación al Schema
```prisma
model Veterinarian {
  // ... campos existentes
  verifiedBy   Int?      // ID del admin que verificó
  verifiedAt   DateTime? // Fecha de verificación
  verificationNotes String? // Notas del admin
}
```

### 2. Notificaciones
- Email al veterinario cuando es aprobado/rechazado
- Notificación push si está disponible

### 3. Subida de Documentos
- Endpoint para subir cédula profesional
- Endpoint para subir diploma
- Admin puede ver documentos antes de aprobar

### 4. Panel de Admin en Frontend
- Lista de veterinarios pendientes
- Ver perfil completo
- Botones de aprobar/rechazar
- Campo para notas

---

## ✅ CHECKLIST

- [x] Endpoint para listar pendientes
- [x] Endpoint para aprobar/rechazar
- [x] Validación de rol ADMIN
- [x] Solo PENDING puede ser verificado
- [ ] Crear usuario admin (manual en BD o endpoint)
- [ ] Probar flujo completo
- [ ] (Opcional) Agregar campos de verificación al schema
- [ ] (Opcional) Notificaciones al veterinario

---

## 🚀 LISTO PARA USAR

El sistema está implementado y listo. Solo necesitas:

1. **Crear un usuario admin** (actualizar en BD o crear endpoint)
2. **Probar los endpoints** con Postman
3. **Aprobar/rechazar veterinarios** según corresponda

**¿Quieres que agregue alguna mejora adicional?**
