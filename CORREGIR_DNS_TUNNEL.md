# 🔧 Corregir DNS: Cambiar de CNAME a Tunnel

## ❌ Problema Actual

El DNS para `nala-api.patasypelos.xyz` está configurado como **CNAME**:
- Tipo: `CNAME`
- Name: `nala-api`
- Content: `mundialpet-tunnel.cfargotunnel.com`

Pero los otros registros usan **Tunnel**:
- `api` → Tipo: `Tunnel` → `mundialpet-tunnel`
- `patasypelos.xyz` → Tipo: `Tunnel` → `mundialpet-tunnel`

## ✅ Solución: Cambiar a Tipo Tunnel

### Paso 1: Eliminar el Registro CNAME Actual

1. Ve a: https://dash.cloudflare.com/4d946dcff804ca30bd621c48a5ff3419/patasypelos.xyz/dns/records
2. Busca el registro `nala-api` (tipo CNAME)
3. Click en **"Edit"** o el icono de editar
4. Click en **"Delete"** para eliminarlo

### Paso 2: Crear Nuevo Registro Tipo Tunnel

1. Click en **"Add record"**
2. Configurar:
   - **Type:** `Tunnel` (no CNAME)
   - **Name:** `nala-api`
   - **Tunnel:** `mundialpet-tunnel` (el mismo que usan los otros)
   - **Proxy status:** `Proxied` (debe estar en naranja ☁️)
   - **TTL:** `Auto`
3. Click en **"Save"**

### Paso 3: Verificar

Después de guardar, deberías ver:

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| Tunnel | api | mundialpet-tunnel | Proxied | Auto |
| **Tunnel** | **nala-api** | **mundialpet-tunnel** | **Proxied** | **Auto** |
| Tunnel | patasypelos.xyz | mundialpet-tunnel | Proxied | Auto |

## 🔄 Reiniciar el Túnel

Después de cambiar el DNS, reinicia el túnel:

```powershell
# Detener túnel
Stop-Process -Name cloudflared -Force

# Iniciar túnel
cd "C:\Proyectos Jean Git\nala-api"
.\INICIAR_TUNEL.ps1
```

## ⏱️ Esperar Propagación

- Los cambios DNS pueden tardar 1-2 minutos
- El túnel puede tardar 30-60 segundos en conectarse
- Prueba después de 2-3 minutos: `https://nala-api.patasypelos.xyz`

## 🧪 Verificación

Después de cambiar el DNS y reiniciar el túnel:

1. **Verificar que el túnel esté corriendo:**
   ```powershell
   Get-Process -Name cloudflared
   ```

2. **Probar la API:**
   ```
   https://nala-api.patasypelos.xyz
   ```

## 📝 Nota

El tipo **Tunnel** es más directo y recomendado cuando usas Cloudflare Tunnels. El tipo **CNAME** también funciona, pero puede tener más latencia o problemas de resolución.

---

**✅ Después de cambiar a Tunnel, el error 1033 debería desaparecer.**
