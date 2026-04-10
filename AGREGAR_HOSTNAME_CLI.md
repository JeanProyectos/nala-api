# 🔧 Agregar Hostname usando Cloudflare CLI

## ⚠️ Problema

El túnel está gestionado remotamente desde el Dashboard, por lo que el `config.yml` local se ignora. Necesitas agregar el hostname desde el Dashboard o usando la CLI.

## ✅ Solución: Usar Cloudflare CLI

### Opción 1: Agregar desde el Dashboard (Recomendado)

1. **Ve al túnel:** Networks → Connectors → Cloudflare Tunnels → mundialpet-tunnel

2. **Haz clic en el túnel** para abrir sus detalles

3. **Busca la pestaña "Published application routes"** o cualquier sección que permita agregar rutas

4. **Si no encuentras la opción**, el túnel puede estar en modo "remotely managed" y necesitas usar la API

### Opción 2: Usar Cloudflare API (Alternativa)

Si no puedes agregarlo desde el Dashboard, puedes usar la API de Cloudflare:

```powershell
# Necesitarás tu API Token de Cloudflare
# Ve a: https://dash.cloudflare.com/profile/api-tokens
# Crea un token con permisos de Zero Trust

# Luego ejecuta:
$headers = @{
    "Authorization" = "Bearer TU_API_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    config = @{
        ingress = @(
            @{
                hostname = "nala-api.patasypelos.xyz"
                service = "http://127.0.0.1:3000"
            }
        )
    }
} | ConvertTo-Json -Depth 10

# Reemplaza TU_TUNNEL_ID con: cf17188d-566f-442f-894a-2a8822c49dfe
# Reemplaza TU_ACCOUNT_ID con tu Account ID de Cloudflare
Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/TU_ACCOUNT_ID/cfd_tunnel/TU_TUNNEL_ID/config" -Method Put -Headers $headers -Body $body
```

### Opción 3: Cambiar a Modo Local (Más Simple)

Si el Dashboard no te permite agregar hostnames fácilmente, puedes cambiar el túnel a modo local:

1. **Detener el túnel actual:**
   ```powershell
   Stop-Process -Name cloudflared -Force
   ```

2. **El túnel ya tiene el config.yml correcto** con `nala-api.patasypelos.xyz`

3. **Iniciar el túnel en modo local** (usando el config.yml):
   ```powershell
   cd "$env:USERPROFILE\.cloudflared"
   cloudflared tunnel run cf17188d-566f-442f-894a-2a8822c49dfe
   ```

4. **Esto hará que el túnel use el config.yml local** en lugar del Dashboard

## 🎯 Recomendación

**Prueba primero:** Volver al Dashboard y buscar en la pestaña "Published application routes" del túnel.

**Si no funciona:** Cambia a modo local usando el config.yml que ya tienes configurado correctamente.
