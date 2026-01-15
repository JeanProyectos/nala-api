# 🚀 Guía para Probar la API con Postman

## 📋 Endpoints Disponibles

### 1. Registro de Usuario (POST)

**URL:** `http://localhost:3000/auth/register`

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "test@nala.com",
  "password": "123456"
}
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": 1,
    "email": "test@nala.com",
    "createdAt": "2024-01-07T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ IMPORTANTE:** Guarda el `token` de la respuesta para los siguientes requests.

---

### 2. Login (POST)

**URL:** `http://localhost:3000/auth/login`

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "test@nala.com",
  "password": "123456"
}
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": 1,
    "email": "test@nala.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ IMPORTANTE:** Guarda el `token` de la respuesta.

---

### 3. Obtener Perfil del Usuario (GET) - Requiere Autenticación

**URL:** `http://localhost:3000/users/me`

**Método:** `GET`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Ejemplo:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "email": "test@nala.com",
  "createdAt": "2024-01-07T...",
  "updatedAt": "2024-01-07T...",
  "pets": []
}
```

---

### 4. Crear Mascota (POST) - Requiere Autenticación

**URL:** `http://localhost:3000/pets`

**Método:** `POST`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Max",
  "species": "Perro",
  "age": 3,
  "weight": 15.5
}
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "name": "Max",
  "species": "Perro",
  "age": 3,
  "weight": 15.5,
  "ownerId": 1,
  "createdAt": "2024-01-07T...",
  "updatedAt": "2024-01-07T..."
}
```

---

### 5. Obtener Todas las Mascotas (GET) - Requiere Autenticación

**URL:** `http://localhost:3000/pets`

**Método:** `GET`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "name": "Max",
    "species": "Perro",
    "age": 3,
    "weight": 15.5,
    "ownerId": 1,
    "createdAt": "2024-01-07T...",
    "updatedAt": "2024-01-07T..."
  }
]
```

---

### 6. Obtener una Mascota por ID (GET) - Requiere Autenticación

**URL:** `http://localhost:3000/pets/1`

**Método:** `GET`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "name": "Max",
  "species": "Perro",
  "age": 3,
  "weight": 15.5,
  "ownerId": 1,
  "createdAt": "2024-01-07T...",
  "updatedAt": "2024-01-07T..."
}
```

---

### 7. Actualizar Mascota (PATCH) - Requiere Autenticación

**URL:** `http://localhost:3000/pets/1`

**Método:** `PATCH`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Maximus",
  "age": 4
}
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "name": "Maximus",
  "species": "Perro",
  "age": 4,
  "weight": 15.5,
  "ownerId": 1,
  "createdAt": "2024-01-07T...",
  "updatedAt": "2024-01-07T..."
}
```

---

### 8. Eliminar Mascota (DELETE) - Requiere Autenticación

**URL:** `http://localhost:3000/pets/1`

**Método:** `DELETE`

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "name": "Maximus",
  "species": "Perro",
  "age": 4,
  "weight": 15.5,
  "ownerId": 1,
  "createdAt": "2024-01-07T...",
  "updatedAt": "2024-01-07T..."
}
```

---

## 📝 Pasos para Probar en Postman

### Paso 1: Instalar Postman
Si no lo tienes, descárgalo de: https://www.postman.com/downloads/

### Paso 2: Verificar que el Backend esté Corriendo
```powershell
cd C:\nala-api
npm run start:dev
```

Deberías ver: `🚀 API NALA corriendo en http://localhost:3000`

### Paso 3: Probar Endpoints en Orden

1. **Registro** → Obtén el token
2. **Login** → Obtén el token (o usa el del registro)
3. **Obtener Perfil** → Usa el token en el header Authorization
4. **Crear Mascota** → Usa el token
5. **Obtener Mascotas** → Usa el token
6. **Actualizar/Eliminar** → Usa el token

### Paso 4: Configurar Variables en Postman (Opcional pero Recomendado)

1. Crea una nueva Collection llamada "NALA API"
2. Ve a "Variables" de la Collection
3. Agrega:
   - `base_url`: `http://localhost:3000`
   - `token`: (déjalo vacío, se llenará automáticamente)

4. En los requests, usa:
   - URL: `{{base_url}}/auth/register`
   - En el script "Tests" del request de Login, agrega:
   ```javascript
   if (pm.response.code === 200) {
       var jsonData = pm.response.json();
       pm.collectionVariables.set("token", jsonData.token);
   }
   ```

5. En los headers de requests protegidos, usa:
   ```
   Authorization: Bearer {{token}}
   ```

---

## 🔍 Errores Comunes

### Error 401 Unauthorized
- Verifica que el token esté en el header `Authorization: Bearer TOKEN`
- Verifica que el token no haya expirado (tokens duran 7 días)

### Error 500 Internal Server Error
- Verifica que el backend esté corriendo
- Verifica que la base de datos esté conectada
- Revisa los logs del backend para ver el error específico

### Error 400 Bad Request
- Verifica que el body JSON esté bien formateado
- Verifica que todos los campos requeridos estén presentes

---

## ✅ Checklist de Pruebas

- [ ] Backend corriendo en puerto 3000
- [ ] Registro de usuario funciona
- [ ] Login funciona y devuelve token
- [ ] Obtener perfil funciona con token
- [ ] Crear mascota funciona con token
- [ ] Obtener todas las mascotas funciona con token
- [ ] Actualizar mascota funciona con token
- [ ] Eliminar mascota funciona con token

---

## 🎯 Flujo Completo de Prueba

1. **POST** `/auth/register` → Guarda el token
2. **POST** `/auth/login` → Verifica que funcione
3. **GET** `/users/me` → Con el token del paso 1
4. **POST** `/pets` → Crea una mascota con el token
5. **GET** `/pets` → Lista todas las mascotas con el token
6. **GET** `/pets/1` → Obtiene la mascota con ID 1
7. **PATCH** `/pets/1` → Actualiza la mascota
8. **DELETE** `/pets/1` → Elimina la mascota

¡Listo! Ya puedes probar toda la API 🚀


