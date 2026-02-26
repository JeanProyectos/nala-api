# 🏪 MARKETPLACE DE CONSULTAS VETERINARIAS - Implementación Completa

## ✅ IMPLEMENTADO

### 1. **Schema Prisma Actualizado**

#### Modelo `Veterinarian`
- ✅ `priceChat`, `priceVoice`, `priceVideo` (precios por tipo)
- ✅ `wompiSubaccountId` (ID de subcuenta Wompi)
- ✅ `wompiAccountStatus` (PENDING | VERIFIED | REJECTED)

#### Modelo `Consultation`
- ✅ `price`, `platformFee`, `veterinarianAmount` (montos calculados)
- ✅ `status`: PENDING_PAYMENT | PAID | IN_PROGRESS | FINISHED | CANCELLED | EXPIRED
- ✅ `scheduledAt` (fecha programada)

#### Modelo `Payment` (NUEVO)
- ✅ `wompiTransactionId`, `wompiReference`
- ✅ `amount`, `platformFee`, `veterinarianAmount`
- ✅ `status`: PENDING | APPROVED | DECLINED | ERROR
- ✅ `wompiResponse` (JSON completo del webhook)

### 2. **Módulo Marketplace Payments**

#### Servicios
- ✅ `WompiService`: Integración con API de Wompi
  - Crear subcuentas (subcomercios)
  - Crear transacciones con split payment
  - Validar firma de webhooks
  - Obtener token de aceptación

- ✅ `MarketplacePaymentsService`: Lógica de negocio
  - Onboarding de veterinarios
  - Crear pagos con split automático (85% vet, 15% plataforma)
  - Procesar webhooks de Wompi
  - Calcular comisiones

- ✅ `ConsultationExpirationService`: Cron job
  - Expira consultas no pagadas después de 30 minutos

#### Endpoints
- ✅ `POST /marketplace/onboard-veterinarian` - Onboarding en Wompi
- ✅ `POST /marketplace/payments/create` - Crear pago
- ✅ `POST /marketplace/payments/wompi/webhook` - Webhook de Wompi

### 3. **Lógica de Consultas Actualizada**

- ✅ Consultas se crean en estado `PENDING_PAYMENT`
- ✅ Precios calculados según tipo (CHAT/VOICE/VIDEO)
- ✅ Comisiones calculadas automáticamente (15% plataforma, 85% veterinario)
- ✅ Solo se pueden iniciar consultas con estado `PAID`
- ✅ Validación de pago en WebSocket antes de permitir mensajes

### 4. **WebSocket Gateway Actualizado**

- ✅ Verifica que la consulta esté `PAID` o `IN_PROGRESS` antes de permitir conexión
- ✅ Bloquea envío de mensajes si la consulta no está pagada
- ✅ Emite error con `requiresPayment: true` cuando falta pago

### 5. **Cron Job de Expiración**

- ✅ Se ejecuta cada 5 minutos
- ✅ Expira consultas en `PENDING_PAYMENT` creadas hace más de 30 minutos
- ✅ Cambia estado a `EXPIRED`

## 📋 FLUJO COMPLETO

### Paso 1: Onboarding de Veterinario
```
1. Veterinario se registra → Se crea perfil Veterinarian
2. Veterinario completa onboarding → POST /marketplace/onboard-veterinarian
3. Sistema crea subcuenta en Wompi → Guarda wompiSubaccountId
4. Estado inicial: PENDING (Wompi valida identidad)
```

### Paso 2: Crear Consulta
```
1. Usuario crea consulta → POST /consultations
2. Sistema calcula:
   - price = precio según tipo (CHAT/VOICE/VIDEO)
   - platformFee = 15% de price
   - veterinarianAmount = 85% de price
3. Consulta creada en estado PENDING_PAYMENT
```

### Paso 3: Crear Pago
```
1. Usuario solicita pago → POST /marketplace/payments/create
2. Sistema crea transacción en Wompi con split:
   - Total: price
   - Veterinario: veterinarianAmount (85%)
   - Plataforma: platformFee (15%)
3. Retorna checkoutUrl para redirigir al usuario
```

### Paso 4: Procesar Pago
```
1. Usuario completa pago en Wompi
2. Wompi envía webhook → POST /marketplace/payments/wompi/webhook
3. Sistema valida firma
4. Si APPROVED:
   - Payment → APPROVED
   - Consultation → PAID
   - Emite evento "consultation_paid"
5. Si DECLINED:
   - Payment → DECLINED
   - Consultation → PENDING_PAYMENT
```

### Paso 5: Iniciar Consulta
```
1. Usuario/Veterinario intenta iniciar → WebSocket join_consultation
2. Sistema verifica: status === PAID o IN_PROGRESS
3. Si está pagada → Permite conexión y mensajes
4. Si no está pagada → Bloquea con error requiresPayment
```

## 🔐 VARIABLES DE ENTORNO

Agregar al `.env`:

```env
# Wompi Marketplace
WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxxxxxxxxxx
WOMPI_INTEGRITY_SECRET=xxxxxxxxxxxxx
WOMPI_BASE_URL=https://sandbox.wompi.co/v1  # Desarrollo
# WOMPI_BASE_URL=https://production.wompi.co/v1  # Producción
FRONTEND_URL=http://localhost:8081
```

## 🚀 PRÓXIMOS PASOS

1. **Ejecutar migración de Prisma:**
   ```bash
   npx prisma migrate dev --name add_marketplace_payments
   ```

2. **Configurar webhook en Wompi Dashboard:**
   - URL: `https://tu-dominio.com/marketplace/payments/wompi/webhook`
   - Copiar `WOMPI_INTEGRITY_SECRET`

3. **Probar flujo completo:**
   - Onboarding de veterinario
   - Crear consulta
   - Crear pago
   - Completar pago en Wompi
   - Verificar que consulta pasa a PAID
   - Iniciar chat

## 📝 NOTAS IMPORTANTES

- ⚠️ El dinero NO pasa por la plataforma, Wompi divide automáticamente
- ⚠️ La plataforma solo recibe su comisión (15%)
- ⚠️ El veterinario recibe su parte (85%) directamente
- ⚠️ Las consultas no pagadas expiran en 30 minutos
- ⚠️ Solo consultas pagadas pueden iniciar chat
