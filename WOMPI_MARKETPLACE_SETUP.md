# 🏪 WOMPI MARKETPLACE - Configuración

## Variables de Entorno Requeridas

Agregar al archivo `.env`:

```env
# Wompi Marketplace
WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxxxxxxxxxx
WOMPI_INTEGRITY_SECRET=xxxxxxxxxxxxx
WOMPI_BASE_URL=https://sandbox.wompi.co/v1  # Para desarrollo
# WOMPI_BASE_URL=https://production.wompi.co/v1  # Para producción
FRONTEND_URL=http://localhost:8081  # URL del frontend para redirects
```

## Flujo de Pago

### 1. Onboarding de Veterinario

**Endpoint:** `POST /marketplace/onboard-veterinarian`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Body:**
```json
{
  "email": "vet@example.com",
  "legalName": "Dr. Juan Pérez",
  "contactName": "Juan Pérez",
  "phoneNumber": "+573001234567",
  "legalId": "1234567890",
  "accountType": "COLLECTION"
}
```

**Respuesta:**
```json
{
  "id": 1,
  "wompiSubaccountId": "sb_xxxxxxxxxxxxx",
  "wompiAccountStatus": "PENDING"
}
```

### 2. Crear Consulta

**Endpoint:** `POST /consultations`

La consulta se crea automáticamente en estado `PENDING_PAYMENT` con:
- `price`: Precio total según tipo (CHAT/VOICE/VIDEO)
- `platformFee`: 15% de comisión
- `veterinarianAmount`: 85% para el veterinario

### 3. Crear Pago

**Endpoint:** `POST /marketplace/payments/create`

**Body:**
```json
{
  "consultationId": 1,
  "paymentMethod": "CARD",
  "redirectUrl": "http://localhost:8081/consultation/1/payment-callback"
}
```

**Respuesta:**
```json
{
  "payment": {
    "id": 1,
    "wompiTransactionId": "12345",
    "wompiReference": "CONSULT_1_1234567890",
    "status": "PENDING"
  },
  "checkoutUrl": "https://checkout.wompi.co/...",
  "transactionId": "12345"
}
```

### 4. Webhook de Wompi

**Endpoint:** `POST /marketplace/payments/wompi/webhook`

Wompi enviará eventos cuando cambie el estado del pago.

**Eventos:**
- `transaction.updated` → Actualiza estado del pago y consulta

**Estados:**
- `APPROVED` → Consulta pasa a `PAID`
- `DECLINED` → Consulta permanece en `PENDING_PAYMENT`

## Configuración en Wompi Dashboard

1. Ir a **Marketplace** → **Subcomercios**
2. Configurar webhook: `https://tu-dominio.com/marketplace/payments/wompi/webhook`
3. Copiar `WOMPI_INTEGRITY_SECRET` desde la configuración

## Migración de Base de Datos

Ejecutar migración de Prisma:

```bash
npx prisma migrate dev --name add_marketplace_payments
```

## Notas Importantes

- Las consultas se crean en `PENDING_PAYMENT`
- Solo se pueden iniciar si están en estado `PAID`
- Las consultas no pagadas expiran después de 30 minutos
- El split payment es automático: 85% veterinario, 15% plataforma
- El veterinario debe tener `wompiSubaccountId` configurado
