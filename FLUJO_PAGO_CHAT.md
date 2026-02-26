# 💳 FLUJO DE PAGO Y CHAT

## 🔄 Flujo Completo

```
1. Usuario selecciona veterinario
   ↓
2. Crea consulta (status: PENDING_PAYMENT)
   ↓
3. Redirige a pantalla de PAGO
   ↓
4. Usuario paga en Wompi
   ↓
5. Webhook actualiza status a PAID
   ↓
6. Usuario puede chatear
```

---

## 📱 Pantallas

### 1. Crear Consulta
**Archivo:** `app/(tabs)/consultar/veterinarios.js`

**Flujo:**
- Usuario selecciona veterinario
- Toca "Consultar" → Elige tipo (Chat/Voz/Video)
- Se crea consulta con `status: PENDING_PAYMENT`
- **Redirige a:** `pago-consulta?id={consultationId}`

---

### 2. Pantalla de Pago
**Archivo:** `app/(tabs)/consultar/pago-consulta.js`

**Funcionalidades:**
- Muestra información de la consulta
- Muestra precio total y desglose de comisiones
- Botón "Pagar Ahora" → Crea pago en Wompi
- Abre checkout de Wompi en navegador
- Botón "Verificar Estado" para revisar si ya pagó

**Estados:**
- `PENDING_PAYMENT`: Muestra botón de pago
- `PAID`: Muestra botón "Ir al Chat"
- `EXPIRED`: Muestra mensaje de expirada

---

### 3. Pantalla de Chat
**Archivo:** `app/(tabs)/consultar/consulta-chat.js`

**Validaciones:**
- Si `status === PENDING_PAYMENT` → Redirige a pago
- Si `status === PAID` o `IN_PROGRESS` → Permite chatear
- Conecta a WebSocket
- Envía/recibe mensajes en tiempo real

---

## 🔌 Endpoints Usados

### Crear Consulta
```typescript
POST /consultations
{
  "type": "CHAT",
  "veterinarianId": 1
}
```

### Crear Pago
```typescript
POST /marketplace/payments/create
{
  "consultationId": 1,
  "redirectUrl": "exp://..."
}
```

**Respuesta:**
```json
{
  "payment": { ... },
  "checkoutUrl": "https://checkout.wompi.co/...",
  "transactionId": "12345"
}
```

---

## ⚠️ Problemas Comunes

### "No puedo chatear"

**Causa:** La consulta no está pagada

**Solución:**
1. Verificar estado de la consulta
2. Si está `PENDING_PAYMENT`, ir a pantalla de pago
3. Completar el pago en Wompi
4. Volver a intentar chatear

---

### "Mensajes no aparecen"

**Causas posibles:**
1. WebSocket no conectado
2. Consulta no está en estado `PAID` o `IN_PROGRESS`
3. Error de conexión

**Solución:**
1. Verificar conexión a internet
2. Verificar que la consulta esté pagada
3. Recargar la pantalla
4. Verificar logs del backend

---

### "No se abre el checkout de Wompi"

**Solución:**
1. Copiar el URL manualmente
2. Abrirlo en navegador
3. Completar el pago
4. Volver a la app y verificar estado

---

## ✅ Checklist de Prueba

- [ ] Crear consulta desde búsqueda de veterinarios
- [ ] Ver pantalla de pago con información correcta
- [ ] Crear pago y abrir checkout de Wompi
- [ ] Completar pago en Wompi
- [ ] Verificar que consulta cambia a `PAID`
- [ ] Poder chatear después del pago
- [ ] Mensajes se envían y reciben correctamente

---

## 🚀 Listo

El flujo completo está implementado. Ahora:
1. Se crea la consulta
2. Se redirige al pago
3. Usuario paga
4. Puede chatear
