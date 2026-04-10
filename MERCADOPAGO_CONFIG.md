# 💳 Configuración de Mercado Pago

## Variables de Entorno Requeridas

Agregar al archivo `.env`:

```env
# Mercado Pago
MP_ACCESS_TOKEN=TU_ACCESS_TOKEN_AQUI
MP_PUBLIC_KEY=TU_PUBLIC_KEY_AQUI
MP_WEBHOOK_SECRET=TU_WEBHOOK_SECRET_AQUI
MP_BASE_URL=https://api.mercadopago.com  # Por defecto, no cambiar a menos que uses sandbox
API_URL=https://tu-dominio.com  # URL de tu API para webhooks
FRONTEND_URL=https://tu-frontend.com  # URL del frontend para redirects
```

## Cómo Obtener las Credenciales

1. **Crear cuenta en Mercado Pago:**
   - Ve a https://www.mercadopago.com.co
   - Crea una cuenta o inicia sesión

2. **Obtener Access Token:**
   - Ve a: https://www.mercadopago.com.co/developers/panel/app
   - Crea una aplicación o selecciona una existente
   - En "Credenciales de producción" o "Credenciales de prueba", copia el **Access Token**

3. **Obtener Public Key:**
   - En la misma sección de credenciales, copia la **Public Key**

4. **Configurar Webhook:**
   - En la configuración de tu aplicación, agrega la URL del webhook:
   - `https://tu-dominio.com/marketplace/payments/mercadopago/webhook`
   - Copia el **Webhook Secret** que te proporciona Mercado Pago

## Modo Sandbox (Pruebas)

Para pruebas, puedes usar las credenciales de prueba:
- Ve a: https://www.mercadopago.com.co/developers/panel/app
- Usa las "Credenciales de prueba"
- No necesitas cambiar `MP_BASE_URL`, el mismo endpoint funciona para pruebas

## Flujo de Pagos

1. **Veterinario configura cuenta:**
   - Endpoint: `POST /marketplace/onboard-veterinarian`
   - Se crea un vendedor en Mercado Pago (requiere configuración adicional en producción)

2. **Usuario crea consulta:**
   - Se calcula automáticamente la comisión según la configuración del admin
   - Se guarda el precio, comisión y monto del veterinario

3. **Usuario paga:**
   - Se crea una preferencia de pago en Mercado Pago
   - Se configura `application_fee` para la comisión de la plataforma
   - El usuario es redirigido al checkout de Mercado Pago

4. **Webhook actualiza estado:**
   - Mercado Pago envía un webhook cuando cambia el estado del pago
   - El sistema actualiza automáticamente el estado de la consulta

## Notas Importantes

- **Los campos de la BD se reutilizan:** `wompiSubaccountId` almacena el ID de Mercado Pago
- **Los veterinarios reciben el dinero directamente** a su cuenta de Mercado Pago
- **La comisión se calcula automáticamente** según la configuración del admin
- **En producción**, asegúrate de usar las credenciales de producción, no las de prueba

## Próximos Pasos

1. ✅ Configurar variables de entorno
2. ✅ Probar onboarding de veterinario
3. ✅ Probar creación de preferencia de pago
4. ✅ Configurar webhook en Mercado Pago
5. ✅ Probar flujo completo de pago
