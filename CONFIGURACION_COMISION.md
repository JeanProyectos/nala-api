# 💰 CONFIGURACIÓN DE COMISIÓN DE PLATAFORMA

## 📋 Resumen

Sistema implementado para que el **ADMIN** pueda configurar el porcentaje de comisión que recibe la plataforma por cada consulta pagada.

---

## 🗄️ Base de Datos

### Modelo `PlatformConfig`

```prisma
model PlatformConfig {
  id                    Int      @id @default(autoincrement())
  platformFeePercentage Float   @default(0.15) // 0.15 = 15%
  updatedBy             Int? // ID del admin que actualizó
  updatedAt             DateTime @updatedAt
  createdAt             DateTime @default(now())
}
```

**Valor por defecto:** 15% (0.15)

---

## 🔌 Endpoints API

### 1. Obtener Configuración Actual

**GET** `/admin/platform-config`

**Headers:**
```
Authorization: Bearer <token_admin>
```

**Respuesta:**
```json
{
  "id": 1,
  "platformFeePercentage": 0.15,
  "updatedBy": 6,
  "updatedAt": "2026-02-24T12:00:00Z",
  "createdAt": "2026-02-24T10:00:00Z"
}
```

---

### 2. Actualizar Comisión

**PUT** `/admin/platform-config/commission`

**Headers:**
```
Authorization: Bearer <token_admin>
Content-Type: application/json
```

**Body:**
```json
{
  "percentage": 0.20
}
```

**Nota:** `percentage` debe estar entre 0 y 1:
- `0.15` = 15%
- `0.20` = 20%
- `0.25` = 25%
- etc.

**Respuesta:**
```json
{
  "id": 1,
  "platformFeePercentage": 0.20,
  "updatedBy": 6,
  "updatedAt": "2026-02-24T12:30:00Z"
}
```

---

## 📱 Pantalla en App Móvil

**Ruta:** `app/admin/configurar-comision.js`

**Acceso:**
1. Login como ADMIN
2. Ir a "Perfil" (última pestaña)
3. Tocar "💰 Configurar Comisión"

**Funcionalidades:**
- Ver comisión actual
- Cambiar porcentaje (0-100%)
- Ver ejemplo de cálculo
- Confirmar cambios

---

## 🔄 Cómo Funciona

### Flujo de Cálculo

1. **Usuario crea consulta:**
   ```typescript
   POST /consultations
   {
     "type": "CHAT",
     "veterinarianId": 1
   }
   ```

2. **Sistema calcula comisiones:**
   ```typescript
   // Obtiene porcentaje de BD
   const percentage = await platformConfigService.getCommissionPercentage();
   
   // Calcula fees
   const platformFee = price * percentage;
   const veterinarianAmount = price - platformFee;
   ```

3. **Se guarda en la consulta:**
   ```json
   {
     "price": 50000,
     "platformFee": 7500,      // 15% de 50000
     "veterinarianAmount": 42500 // 85% de 50000
   }
   ```

4. **Al pagar, Wompi divide automáticamente:**
   - Veterinario recibe: `veterinarianAmount`
   - Plataforma recibe: `platformFee`

---

## ⚙️ Configuración Inicial

### Primera Vez

Si no existe configuración, se crea automáticamente con **15%** por defecto.

### Cambiar Comisión

1. **Desde la App:**
   - Admin → Perfil → Configurar Comisión
   - Ingresar nuevo porcentaje
   - Guardar

2. **Desde API:**
   ```bash
   PUT http://localhost:3000/admin/platform-config/commission
   Authorization: Bearer <admin_token>
   Content-Type: application/json
   
   {
     "percentage": 0.20
   }
   ```

---

## 📊 Ejemplo de Cálculo

### Consulta de $50,000 COP

**Comisión 15%:**
- Plataforma: $7,500 COP (15%)
- Veterinario: $42,500 COP (85%)

**Comisión 20%:**
- Plataforma: $10,000 COP (20%)
- Veterinario: $40,000 COP (80%)

**Comisión 10%:**
- Plataforma: $5,000 COP (10%)
- Veterinario: $45,000 COP (90%)

---

## ⚠️ Importante

- ✅ El cambio de comisión **solo afecta consultas nuevas**
- ✅ Consultas ya creadas mantienen su comisión original
- ✅ El porcentaje debe estar entre 0 y 1 (0% a 100%)
- ✅ Solo usuarios con rol `ADMIN` pueden cambiar la comisión

---

## 🧪 Probar

1. **Login como admin**
2. **Ir a Perfil → Configurar Comisión**
3. **Cambiar a 20%**
4. **Crear nueva consulta**
5. **Verificar que la comisión es 20%**

---

## ✅ Listo

El sistema está completamente funcional. El admin puede configurar la comisión desde la app móvil.
