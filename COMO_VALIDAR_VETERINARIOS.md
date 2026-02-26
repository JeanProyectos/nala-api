# 👨‍💼 CÓMO VALIDAR VETERINARIOS COMO ADMIN

## 🎯 PASO A PASO

### 1️⃣ Ver Lista de Veterinarios Pendientes

**Endpoint:**
```
GET http://localhost:3000/veterinarians/admin/pending
```

**Headers:**
```
Authorization: Bearer <tu_token_de_admin>
```

**Ejemplo en Postman:**
1. Método: `GET`
2. URL: `http://localhost:3000/veterinarians/admin/pending`
3. Pestaña "Headers":
   - Key: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (tu token completo)
4. Click "Send"

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "fullName": "Dr. Juan Pérez",
    "country": "Colombia",
    "city": "Bogotá",
    "specialty": "GENERAL",
    "yearsExperience": 5,
    "professionalDescription": "Veterinario con experiencia...",
    "status": "PENDING",
    "user": {
      "id": 10,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "+573001234567"
    },
    "createdAt": "2026-02-24T12:00:00.000Z"
  }
]
```

**Si está vacío `[]`:** No hay veterinarios pendientes.

---

### 2️⃣ Revisar Información del Veterinario

Antes de aprobar/rechazar, puedes ver más detalles:

**Endpoint:**
```
GET http://localhost:3000/veterinarians/1
```

**Headers:**
```
Authorization: Bearer <tu_token_de_admin>
```

Esto te muestra:
- Perfil completo
- Calificaciones
- Número de consultas
- Todo el historial

---

### 3️⃣ Aprobar un Veterinario

**Endpoint:**
```
PUT http://localhost:3000/veterinarians/admin/1/verify
```

**Headers:**
```
Authorization: Bearer <tu_token_de_admin>
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "status": "VERIFIED",
  "notes": "Documentos verificados. Veterinario aprobado."
}
```

**Ejemplo en Postman:**
1. Método: `PUT`
2. URL: `http://localhost:3000/veterinarians/admin/1/verify`
   - (Reemplaza `1` con el ID del veterinario que quieres aprobar)
3. Pestaña "Headers":
   - `Authorization: Bearer <tu_token>`
   - `Content-Type: application/json`
4. Pestaña "Body" → Selecciona "raw" → "JSON"
5. Pega el JSON de arriba
6. Click "Send"

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

**Endpoint:**
```
PUT http://localhost:3000/veterinarians/admin/1/verify
```

**Headers:**
```
Authorization: Bearer <tu_token_de_admin>
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "status": "INACTIVE",
  "notes": "Documentos no válidos o incompletos. Por favor, contacta al soporte."
}
```

**✅ Resultado:** El veterinario NO puede recibir consultas.

---

## 📋 FLUJO RECOMENDADO

```
1. GET /veterinarians/admin/pending
   ↓
   Ver lista de pendientes
   ↓
2. GET /veterinarians/:id
   ↓
   Revisar perfil completo del veterinario
   ↓
3. PUT /veterinarians/admin/:id/verify
   ↓
   Aprobar (VERIFIED) o Rechazar (INACTIVE)
```

---

## 🔍 QUÉ REVISAR ANTES DE APROBAR

### Información a Verificar:

1. **Datos Básicos:**
   - Nombre completo
   - País y ciudad
   - Especialidad
   - Años de experiencia

2. **Contacto:**
   - Email válido
   - Teléfono

3. **Precios:**
   - Precios configurados (priceChat, priceVoice, priceVideo)
   - Precios razonables

4. **Descripción:**
   - Descripción profesional completa

---

## ⚠️ IMPORTANTE

- **Solo puedes verificar veterinarios con status `PENDING`**
- **Una vez verificado, no puedes cambiar el status desde este endpoint**
- **Usa `VERIFIED` para aprobar, `INACTIVE` para rechazar**
- **Las notas son opcionales pero recomendadas**

---

## 🧪 PROBAR AHORA

1. **Abre Postman** (o tu herramienta de API)

2. **Haz login como admin:**
   ```
   POST http://localhost:3000/auth/login
   Body: { "email": "admin@nala.co...", "password": "..." }
   ```
   Copia el `token`

3. **Ver pendientes:**
   ```
   GET http://localhost:3000/veterinarians/admin/pending
   Headers: Authorization: Bearer <token>
   ```

4. **Aprobar el primero:**
   ```
   PUT http://localhost:3000/veterinarians/admin/1/verify
   Headers: Authorization: Bearer <token>
   Body: { "status": "VERIFIED", "notes": "Aprobado" }
   ```

---

## ✅ LISTO

¡Ya puedes validar veterinarios! Si necesitas ayuda con algún paso específico, avísame.
