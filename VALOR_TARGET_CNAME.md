# 🎯 Valor para el Campo "Target" en CNAME

## Para el registro CNAME de `nala-api.patasypelos.xyz`

### ✅ Valor Correcto:

```
mundialpet-tunnel.cfargotunnel.com
```

### 📝 Pasos:

1. En el campo **"Target"** de Cloudflare, ingresa:
   ```
   mundialpet-tunnel.cfargotunnel.com
   ```

2. Asegúrate de que:
   - ✅ **Type:** `CNAME`
   - ✅ **Name:** `nala-api`
   - ✅ **Target:** `mundialpet-tunnel.cfargotunnel.com`
   - ✅ **Proxy status:** `Proxied` (naranja ☁️)
   - ✅ **TTL:** `Auto`

3. Click en **"Save"**

### 🔄 Alternativa (si la anterior no funciona):

Si `mundialpet-tunnel.cfargotunnel.com` no es aceptado, intenta:

```
mundialpet-tunnel
```

Cloudflare a veces reconoce el nombre del túnel directamente sin el sufijo.

### ⚠️ Importante:

- El formato es: `[nombre-del-tunnel].cfargotunnel.com`
- En tu caso, el túnel se llama `mundialpet-tunnel`
- Por lo tanto: `mundialpet-tunnel.cfargotunnel.com`

### ✅ Después de Guardar:

1. Ejecuta el script de configuración del túnel:
   ```powershell
   cd "C:\Proyectos Jean Git\nala-api"
   .\configurar-tunnel-cloudflare.ps1
   ```

2. Reinicia el túnel:
   ```powershell
   Restart-Service cloudflared
   ```

3. Prueba la API:
   ```
   https://nala-api.patasypelos.xyz/auth/register
   ```
