# 👨‍💼 CREAR USUARIO ADMINISTRADOR

## 🎯 OPCIÓN 1: Directamente en la Base de Datos (RÁPIDO)

### Paso 1: Generar Hash de Contraseña

**Opción A: Usar Node.js**
```javascript
const bcrypt = require('bcrypt');
bcrypt.hash('tu_password_aqui', 10).then(console.log);
```

**Opción B: Usar herramienta online**
- Ve a: https://bcrypt-generator.com/
- Ingresa tu contraseña
- Copia el hash generado

### Paso 2: Ejecutar SQL en pgAdmin

```sql
-- Reemplaza estos valores:
-- 'admin@nala.com' → Tu email
-- '$2b$10$...' → El hash de tu contraseña

INSERT INTO "User" (email, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'admin@nala.com',
  '$2b$10$TuHashAqui',  -- Hash generado en paso 1
  'Administrador',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET role = 'ADMIN', "isActive" = true;
```

### Paso 3: Verificar

```sql
SELECT id, email, name, role, "isActive" 
FROM "User" 
WHERE role = 'ADMIN';
```

---

## 🎯 OPCIÓN 2: Convertir Usuario Existente a Admin

Si ya tienes un usuario y quieres convertirlo en admin:

```sql
-- Reemplaza 'tu-email@example.com' con el email del usuario
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'tu-email@example.com';
```

---

## 🎯 OPCIÓN 3: Endpoint Temporal (Solo Desarrollo)

Si prefieres crear un endpoint temporal, puedo agregarlo al `auth.controller.ts`:

```typescript
@Post('create-admin')
async createAdmin(@Body() dto: RegisterDto) {
  // Crear usuario con role ADMIN
}
```

**⚠️ IMPORTANTE:** Elimina este endpoint antes de producción.

---

## ✅ DESPUÉS DE CREAR EL ADMIN

### 1. Login como Admin

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@nala.com",
  "password": "tu_password"
}
```

### 2. Usar el Token para Validar Veterinarios

```http
GET http://localhost:3000/veterinarians/admin/pending
Authorization: Bearer <token_del_admin>
```

---

## 🔐 SEGURIDAD

- ✅ Solo usuarios con `role = 'ADMIN'` pueden validar veterinarios
- ✅ El sistema valida el rol en cada request
- ✅ Los endpoints están protegidos con `JwtAuthGuard` + `RolesGuard`

---

## 📝 NOTAS

- El email debe ser único
- La contraseña se encripta con bcrypt (10 rounds)
- El usuario admin puede hacer login normalmente
- Puedes crear múltiples admins si necesitas
