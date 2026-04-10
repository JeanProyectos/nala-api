# 🔧 Registrar Hostname en el Túnel de Cloudflare

## ❌ Problema

El error 530 puede ocurrir cuando el hostname **no está registrado** en el túnel de Cloudflare, aunque esté en el DNS.

## ✅ Solución: Registrar Hostname en Cloudflare Dashboard

### Opción 1: Desde el Dashboard de Cloudflare (Recomendado)

1. **Ve a Cloudflare Dashboard:**
   - https://dash.cloudflare.com/
   - Inicia sesión

2. **Navega a Zero Trust:**
   - Click en **"Zero Trust"** en el menú lateral
   - O ve directamente a: https://one.dash.cloudflare.com/

3. **Ve a Networks → Tunnels:**
   - En el menú lateral, click en **"Networks"**
   - Luego click en **"Tunnels"**

4. **Selecciona tu túnel:**
   - Busca y click en **"mundialpet-tunnel"**

5. **Verifica/Agrega Hostname:**
   - En la sección **"Public Hostnames"** o **"Ingress"**
   - Verifica que `nala-api.patasypelos.xyz` esté en la lista
   - Si **NO está**, click en **"Add a public hostname"** o **"Configure"**
   - Agrega:
     - **Subdomain:** `nala-api`
     - **Domain:** `patasypelos.xyz`
     - **Service:** `http://localhost:3000` o `http://127.0.0.1:3000`
     - **Path:** (dejar vacío)
   - Click en **"Save hostname"**

6. **Espera 1-2 minutos** para que se propague

7. **Prueba:** `https://nala-api.patasypelos.xyz`

### Opción 2: Usar Cloudflare CLI

```powershell
# Registrar hostname en el túnel
cloudflared tunnel route dns nala-api.patasypelos.xyz mundialpet-tunnel
```

### Opción 3: Verificar Configuración del Túnel

El archivo `~/.cloudflared/config.yml` debe tener:

```yaml
ingress:
  - hostname: nala-api.patasypelos.xyz
    service: http://127.0.0.1:3000
    originRequest:
      httpHostHeader: nala-api.patasypelos.xyz
```

## 🔍 Verificación

Después de registrar el hostname:

1. **Verifica en el Dashboard:**
   - El hostname debe aparecer en la lista de Public Hostnames del túnel

2. **Verifica que el túnel esté corriendo:**
   ```powershell
   Get-Process -Name cloudflared
   ```

3. **Prueba la URL:**
   ```
   https://nala-api.patasypelos.xyz
   ```

## 📝 Nota Importante

- **El DNS y el registro en el túnel son diferentes:**
  - DNS: Resuelve el nombre a la IP del túnel
  - Registro en túnel: Le dice al túnel qué hostname manejar

- **Ambos deben estar configurados** para que funcione

## 🚨 Si Aún No Funciona

1. **Verifica los logs del túnel:**
   - En el Dashboard de Cloudflare, ve a Tunnels → mundialpet-tunnel → Logs
   - Busca errores relacionados con `nala-api.patasypelos.xyz`

2. **Reinicia el túnel:**
   ```powershell
   Stop-Process -Name cloudflared -Force
   # Espera 5 segundos
   cd "C:\Proyectos Jean Git\nala-api"
   .\INICIAR_TUNEL.ps1
   ```

3. **Verifica que Node.js esté corriendo:**
   ```powershell
   Get-Process -Name node
   netstat -ano | findstr ":3000"
   ```

---

**✅ La solución más probable es registrar el hostname en el Dashboard de Cloudflare Zero Trust**
