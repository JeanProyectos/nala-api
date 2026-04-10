# 💳 Explicación del Sistema de Pagos - Wompi Marketplace

## 📋 Resumen

El sistema usa **Wompi Marketplace** (no Mercado Pago) para procesar pagos. Wompi es una pasarela de pagos colombiana que permite dividir automáticamente los pagos entre la plataforma y los veterinarios.

## 🔄 Flujo Completo de Pagos

### 1. **Configuración del Veterinario (Onboarding)**

**¿Cómo reciben el dinero los veterinarios?**

Los veterinarios **DEBEN configurar sus datos bancarios** antes de poder recibir pagos. Esto se hace a través de:

- **Pantalla en la app:** `/veterinario/configurar-pagos`
- **Endpoint:** `POST /marketplace/onboard-veterinarian`

**Datos requeridos:**
- Email
- Nombre Legal / Razón Social
- Nombre de Contacto
- Teléfono
- Cédula o NIT
- Tipo de Cuenta (COLLECTION o DISPERSION)

**Proceso:**
1. El veterinario completa el formulario en la app
2. Se crea una "subcuenta" en Wompi Marketplace
3. Wompi revisa y verifica los datos (puede tardar 1-3 días)
4. Una vez aprobada, el veterinario puede recibir pagos automáticamente

**⚠️ IMPORTANTE:** Si un veterinario NO tiene datos bancarios configurados:
- No puede recibir pagos
- Las consultas NO se pueden crear (el sistema valida esto)
- Debe completar el onboarding primero

### 2. **Creación de Consulta**

Cuando un usuario crea una consulta:

```javascript
POST /consultations
{
  "veterinarianId": 1,
  "type": "CHAT",
  "petId": 1
}
```

**El sistema automáticamente:**
1. Obtiene el precio del veterinario según el tipo (CHAT/VOICE/VIDEO)
2. Calcula la comisión usando el porcentaje configurado por el admin
3. Calcula cuánto recibe el veterinario
4. Crea la consulta en estado `PENDING_APPROVAL`

**Ejemplo de cálculo:**
- Precio de consulta: $50,000 COP
- Comisión plataforma (15%): $7,500 COP
- Veterinario recibe: $42,500 COP

### 3. **Proceso de Pago**

**Usuario paga:**
1. Usuario va a la pantalla de pago (`/consultar/pago-consulta`)
2. Se crea una transacción en Wompi con "split payment"
3. El pago se divide automáticamente:
   - **Plataforma:** Recibe la comisión directamente
   - **Veterinario:** Recibe su parte directamente a su cuenta bancaria configurada

**Split Payment en Wompi:**
```javascript
{
  amountInCents: 5000000,  // $50,000 COP
  split: {
    merchantId: "subcuenta_del_veterinario",
    amountInCents: 4250000  // $42,500 COP para el veterinario
  }
}
```

### 4. **Distribución del Dinero**

**¿Cómo se envían los datos de comisión?**

1. **Admin configura la comisión:**
   - Pantalla: `/admin/configurar-comision`
   - Endpoint: `PUT /platform-config/commission`
   - Se guarda en la tabla `PlatformConfig`

2. **Al crear una consulta:**
   - El sistema lee el porcentaje de comisión desde `PlatformConfig`
   - Calcula: `platformFee = price * commissionPercentage`
   - Calcula: `veterinarianAmount = price - platformFee`
   - Guarda estos valores en la consulta

3. **Al crear el pago:**
   - Se envía a Wompi el monto total y el split
   - Wompi divide automáticamente el pago
   - La plataforma recibe su parte
   - El veterinario recibe su parte directamente a su cuenta bancaria

**Ejemplo con comisión del 15%:**
```
Precio total: $50,000 COP
├─ Plataforma (15%): $7,500 COP → Va a la cuenta de la plataforma
└─ Veterinario (85%): $42,500 COP → Va directamente a la cuenta bancaria del veterinario
```

## 🧪 ¿Puedo Probar los Pagos?

**Sí, pero necesitas:**

1. **Configurar variables de entorno en `.env`:**
```env
WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxxxxxxxxxx
WOMPI_INTEGRITY_SECRET=xxxxxxxxxxxxx
WOMPI_BASE_URL=https://sandbox.wompi.co/v1  # Para pruebas
```

2. **Crear cuenta en Wompi Sandbox:**
   - Ve a https://sandbox.wompi.co
   - Crea una cuenta de prueba
   - Obtén las claves de API

3. **Configurar webhook:**
   - En el dashboard de Wompi, configura el webhook:
   - `https://tu-dominio.com/marketplace/payments/wompi/webhook`

4. **Probar el flujo:**
   - Un veterinario configura sus datos bancarios (onboarding)
   - Un usuario crea una consulta
   - El usuario paga usando tarjetas de prueba de Wompi
   - Verificar que el webhook actualiza el estado del pago

## 📊 Estados del Sistema

### Estado de la Cuenta del Veterinario (`wompiAccountStatus`):
- `PENDING`: Pendiente de verificación por Wompi
- `APPROVED`: Cuenta aprobada, puede recibir pagos
- `REJECTED`: Cuenta rechazada, debe corregir datos

### Estado del Pago (`PaymentStatus`):
- `PENDING`: Pago creado, esperando confirmación
- `APPROVED`: Pago aprobado, dinero transferido
- `DECLINED`: Pago rechazado

### Estado de la Consulta (`ConsultationStatus`):
- `PENDING_APPROVAL`: Esperando aprobación del veterinario
- `PAID`: Pagada, esperando aprobación del veterinario
- `IN_PROGRESS`: En curso
- `FINISHED`: Finalizada
- `REJECTED`: Rechazada por el veterinario

## ⚠️ Validaciones Importantes

1. **Al crear una consulta:**
   - ✅ El veterinario debe tener `wompiSubaccountId` configurado
   - ✅ El veterinario debe estar `ACTIVE` o `VERIFIED`
   - ✅ El precio debe ser mayor a 0

2. **Al crear un pago:**
   - ✅ La consulta debe estar en `PENDING_PAYMENT` o `PENDING_APPROVAL`
   - ✅ El veterinario debe tener subcuenta configurada
   - ✅ No debe existir un pago previo aprobado

3. **Al procesar webhook:**
   - ✅ Se valida la firma del webhook
   - ✅ Se actualiza el estado del pago
   - ✅ Se actualiza el estado de la consulta

## 🔍 Cómo Verificar que Todo Funciona

1. **Verificar configuración del veterinario:**
   ```javascript
   GET /veterinarians/me/profile
   // Debe tener: wompiSubaccountId y wompiAccountStatus
   ```

2. **Verificar comisión configurada:**
   ```javascript
   GET /platform-config
   // Debe tener: platformFeePercentage (ej: 0.15 = 15%)
   ```

3. **Verificar creación de consulta:**
   ```javascript
   POST /consultations
   // Debe calcular automáticamente platformFee y veterinarianAmount
   ```

4. **Verificar creación de pago:**
   ```javascript
   POST /marketplace/payments/create
   // Debe crear transacción en Wompi con split payment
   ```

## 📝 Notas Adicionales

- **Wompi maneja automáticamente** la transferencia del dinero a las cuentas bancarias
- **No necesitas hacer transferencias manuales** - todo es automático
- **Los pagos pueden tardar 1-3 días hábiles** en reflejarse en las cuentas
- **En sandbox (pruebas)**, los pagos son simulados y no se transfiere dinero real
- **En producción**, necesitas cambiar `WOMPI_BASE_URL` a `https://production.wompi.co/v1`

## 🚀 Próximos Pasos

1. ✅ Configurar variables de entorno de Wompi
2. ✅ Probar onboarding de veterinario
3. ✅ Probar creación de consulta y cálculo de comisiones
4. ✅ Probar creación de pago con tarjetas de prueba
5. ✅ Verificar webhook y actualización de estados
6. ✅ Configurar webhook en producción cuando esté listo
