# 🔧 Solución: Error 1016 Cloudflare + IIS Archivo Bloqueado

## ❌ Problemas Detectados

1. **IIS Error:** Archivo bloqueado (HRESULT: 0x80070020)
2. **Cloudflare Error 1016:** Origin DNS error - `nala-api.patasypelos.xyz` no resuelve

## 🔍 Causa del Error 1016

El Error 1016 significa que **Cloudflare no puede resolver el DNS del origen**. Esto ocurre cuando:

- ❌ El hostname `nala-api.patasypelos.xyz` **NO está registrado** en el túnel `mundialpet-tunnel`
- ❌ El túnel no está corriendo
- ❌ El túnel está corriendo pero no tiene el hostname configurado en el Dashboard

## ✅ Solución Paso a Paso

### Paso 1: Liberar Archivos Bloqueados en IIS

```powershell
# Detener Node.js si está corriendo
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Reiniciar IIS para liberar archivos bloqueados
iisreset /restart

# Esperar 5 segundos
Start-Sleep -Seconds 5
```

### Paso 2: Verificar que Node.js Esté Corriendo en Puerto 3000

```powershell
# Verificar si Node.js está corriendo
Get-Process -Name node -ErrorAction SilentlyContinue

# Verificar si el puerto 3000 está en uso
netstat -ano | findstr ":3000"

# Si NO está corriendo, iniciarlo:
cd "C:\inetpub\wwwroot\nala-api"
.\iniciar-node-produccion.ps1
```

### Paso 3: Verificar que el Túnel Esté Corriendo

```powershell
# Verificar si cloudflared está corriendo
Get-Process -Name cloudflared -ErrorAction SilentlyContinue

# Si NO está corriendo, iniciarlo:
cd "C:\Proyectos Jean Git\nala-api"
.\INICIAR_TUNEL.ps1
```

### Paso 4: ⚠️ CRÍTICO - Verificar Hostname en Cloudflare Dashboard

El Error 1016 **siempre** significa que el hostname no está registrado en el túnel.

1. **Ve a Cloudflare Dashboard:**
   - https://dash.cloudflare.com/
   - Selecciona el dominio: `patasypelos.xyz`

2. **Ve a Networks → Connectors → Tunnels:**
   - Click en `mundialpet-tunnel`

3. **Ve a la pestaña "Public Hostnames" o "Routes":**
   - Verifica que `nala-api.patasypelos.xyz` esté en la lista
   - Si **NO está**, agrégalo:

4. **Agregar Hostname (si falta):**
   - Click en **"+ Add a public hostname"** o **"Configure"**
   - Configura:
     - **Subdomain:** `nala-api`
     - **Domain:** `patasypelos.xyz` (selecciona del dropdown)
     - **Service:** `http://127.0.0.1:3000`
     - **Path:** (dejar vacío)
     - **HTTP Host Header:** `nala-api.patasypelos.xyz` (opcional pero recomendado)
   - Click en **"Save hostname"**

5. **Espera 1-2 minutos** para que se propague

### Paso 5: Verificar DNS en Cloudflare

1. **Ve a DNS → Records:**
   - Busca el registro para `nala-api`
   - Debe ser:
     - **Type:** `Tunnel` (recomendado) o `CNAME`
     - **Name:** `nala-api`
     - **Target:** `mundialpet-tunnel` (si es Tunnel) o `mundialpet-tunnel.cfargotunnel.com` (si es CNAME)
     - **Proxy:** `Proxied` ✅

2. **Si el registro NO existe o está mal configurado:**
   - Elimina el registro existente (si hay)
   - Crea nuevo registro:
     - **Type:** `Tunnel` (preferido)
     - **Name:** `nala-api`
     - **Tunnel:** `mundialpet-tunnel`
     - **Proxy:** `Proxied` ✅

### Paso 6: Reiniciar Todo (Si es Necesario)

```powershell
# 1. Detener todo
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue

# 2. Reiniciar IIS
iisreset /restart

# 3. Esperar
Start-Sleep -Seconds 5

# 4. Iniciar Node.js
cd "C:\inetpub\wwwroot\nala-api"
.\iniciar-node-produccion.ps1

# 5. Esperar 5 segundos
Start-Sleep -Seconds 5

# 6. Iniciar túnel
cd "C:\Proyectos Jean Git\nala-api"
.\INICIAR_TUNEL.ps1

# 7. Esperar 30 segundos para que el túnel se conecte
Start-Sleep -Seconds 30
```

### Paso 7: Probar

```powershell
# Probar localmente
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing

# Probar públicamente
Invoke-WebRequest -Uri "https://nala-api.patasypelos.xyz" -UseBasicParsing
```

## 🎯 Solución Rápida (Script Automático)

Ejecuta el script `SOLUCIONAR_ERROR_1016.ps1` que crea los pasos automáticamente.

## 📝 Checklist de Verificación

- [ ] Node.js está corriendo en puerto 3000
- [ ] cloudflared está corriendo
- [ ] IIS está iniciado (sin errores de archivo bloqueado)
- [ ] `nala-api.patasypelos.xyz` está en la lista de Public Hostnames del túnel
- [ ] DNS tiene registro Tunnel o CNAME para `nala-api`
- [ ] El túnel apunta a `http://127.0.0.1:3000`
- [ ] Esperaste 1-2 minutos después de agregar el hostname

## ⚠️ Nota Importante

**El Error 1016 SIEMPRE significa que el hostname no está registrado en el túnel.**

Aunque el DNS esté correcto, si Cloudflare Dashboard no tiene el hostname registrado en el túnel, obtendrás Error 1016.

**La solución es agregar el hostname en Cloudflare Dashboard → Tunnels → mundialpet-tunnel → Public Hostnames**

---

**✅ Paso más importante: Verificar que `nala-api.patasypelos.xyz` esté en Public Hostnames del túnel en Cloudflare Dashboard**
