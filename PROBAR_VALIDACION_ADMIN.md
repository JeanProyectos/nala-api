# 🧪 PROBAR SISTEMA DE VALIDACIÓN DE VETERINARIOS

## ✅ Admin Creado

Tu usuario admin está listo:
- **Email:** admin@nala.co...
- **Role:** ADMIN
- **Status:** Active

---

## 🚀 PASOS PARA PROBAR

### 1️⃣ Login como Admin

**POST** `http://localhost:3000/auth/login`

```json
{
  "email": "admin@nala.co...",
  "password": "tu_password"
}
```

**Respuesta:**
```json
{
  "user": {
    "id": 6,
    "email": "admin@nala.co...",
    "name": "Administrador",
    "role": "ADMIN"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ IMPORTANTE:** Copia el `token` para usarlo en los siguientes requests.

---

### 2️⃣ Ver Veterinarios Pendientes

**GET** `http://localhost:3000/veterinarians/admin/pending`

**Headers:**
```
Authorization: Bearer <token_del_admin>
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
    "createdAt": "2026-02-24T12:00:00Z"
  }
]
```

**Si está vacío:** No hay veterinarios pendientes (todos ya fueron verificados o no hay registros).

---

### 3️⃣ Aprobar un Veterinario

**PUT** `http://localhost:3000/veterinarians/admin/1/verify`

**Headers:**
```
Authorization: Bearer <token_del_admin>
Content-Type: application/json
```

**Body:**
```json
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

**✅ Resultado:** El veterinario ahora puede recibir consultas.

---

### 4️⃣ Rechazar un Veterinario

**PUT** `http://localhost:3000/veterinarians/admin/1/verify`

**Headers:**
```
Authorization: Bearer <token_del_admin>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "INACTIVE",
  "notes": "Documentos no válidos o incompletos"
}
```

**✅ Resultado:** El veterinario NO puede recibir consultas.

---

## 🧪 PROBAR CON POSTMAN

### Collection de Ejemplos

1. **Crear nueva Collection:** "NALA Admin"

2. **Request 1: Login Admin**
   - Method: `POST`
   - URL: `http://localhost:3000/auth/login`
   - Body (raw JSON):
     ```json
     {
       "email": "admin@nala.co...",
       "password": "tu_password"
     }
     ```
   - Guarda el `token` de la respuesta

3. **Request 2: Ver Pendientes**
   - Method: `GET`
   - URL: `http://localhost:3000/veterinarians/admin/pending`
   - Headers:
     - `Authorization: Bearer {{token}}`
   - (Crea variable `token` en Postman con el token del login)

4. **Request 3: Aprobar Veterinario**
   - Method: `PUT`
   - URL: `http://localhost:3000/veterinarians/admin/1/verify`
   - Headers:
     - `Authorization: Bearer {{token}}`
     - `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "status": "VERIFIED",
       "notes": "Aprobado"
     }
     ```

---

## 🔍 VERIFICAR QUE FUNCIONA

### Después de Aprobar un Veterinario:

1. **Verificar que aparece en búsqueda:**
   ```
   GET http://localhost:3000/veterinarians
   ```
   El veterinario debería aparecer en la lista (solo `VERIFIED` y `ACTIVE` aparecen).

2. **Verificar que puede recibir consultas:**
   ```
   POST http://localhost:3000/consultations
   Authorization: Bearer <token_usuario>
   {
     "veterinarianId": 1,
     "type": "CHAT"
   }
   ```
   Debería crear la consulta sin problemas.

---

## 🆘 SI HAY ERRORES

### Error: "No tienes permisos"
- ✅ Verifica que el token sea del usuario admin
- ✅ Verifica que el usuario tenga `role = 'ADMIN'` en la BD

### Error: "Veterinario no encontrado"
- ✅ Verifica que el ID del veterinario existe
- ✅ Usa `GET /veterinarians/admin/pending` para ver los IDs disponibles

### Error: "Este veterinario ya fue verificado"
- ✅ El veterinario ya no está en `PENDING`
- ✅ Solo veterinarios en `PENDING` pueden ser verificados

### Error: "El status debe ser VERIFIED o INACTIVE"
- ✅ Usa `"VERIFIED"` para aprobar
- ✅ Usa `"INACTIVE"` para rechazar
- ❌ NO uses `"ACTIVE"` o `"PENDING"`

---

## 📋 CHECKLIST

- [x] Admin creado
- [ ] Login como admin exitoso
- [ ] Ver lista de pendientes
- [ ] Aprobar un veterinario
- [ ] Verificar que aparece en búsqueda
- [ ] (Opcional) Rechazar un veterinario

---

## ✅ TODO LISTO

El sistema está completamente funcional. Ahora puedes:

1. ✅ Ver veterinarios pendientes
2. ✅ Aprobar veterinarios (status → `VERIFIED`)
3. ✅ Rechazar veterinarios (status → `INACTIVE`)
4. ✅ Controlar quién puede recibir consultas

**¡A probar! 🚀**
