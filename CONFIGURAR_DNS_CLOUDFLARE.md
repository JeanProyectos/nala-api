# 🌐 Configurar DNS en Cloudflare para NALA API

Esta guía te muestra cómo agregar el registro DNS para `nala-api.patasypelos.xyz` en Cloudflare sin afectar los registros existentes.

## 📋 Paso 1: Acceder a Cloudflare DNS

1. Ve a: https://dash.cloudflare.com/4d946dcff804ca30bd621c48a5ff3419/patasypelos.xyz/dns/records
2. O navega: **Cloudflare Dashboard** → **patasypelos.xyz** → **DNS** → **Records**

## 📝 Paso 2: Agregar Nuevo Registro DNS

### Opción A: Usar Tipo "Tunnel" (Recomendado)

1. Click en **"Add record"**
2. Configurar:
   - **Type:** `Tunnel`
   - **Name:** `nala-api` (esto creará `nala-api.patasypelos.xyz`)
   - **Tunnel:** `mundialpet-tunnel` (el mismo túnel que ya usas)
   - **Proxy status:** `Proxied` (debe estar en naranja ☁️)
   - **TTL:** `Auto`

3. Click en **"Save"**

### Opción B: Usar Tipo "CNAME" (Alternativa)

Si no tienes la opción "Tunnel" disponible:

1. Click en **"Add record"**
2. Configurar:
   - **Type:** `CNAME`
   - **Name:** `nala-api`
   - **Target:** `mundialpet-tunnel.cfargotunnel.com`
     - ⚠️ **IMPORTANTE:** Usa exactamente este formato: `[nombre-tunnel].cfargotunnel.com`
     - En tu caso: `mundialpet-tunnel.cfargotunnel.com`
   - **Proxy status:** `Proxied` (debe estar en naranja ☁️)
   - **TTL:** `Auto`

3. Click en **"Save"**

**Nota:** Si `mundialpet-tunnel.cfargotunnel.com` no funciona, también puedes intentar solo `mundialpet-tunnel` (sin el `.cfargotunnel.com`), ya que Cloudflare a veces reconoce el nombre del túnel directamente.

## ✅ Verificación

Después de agregar el registro, deberías ver:

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| Tunnel | api | mundialpet-tunnel | Proxied | Auto |
| Tunnel | patasypelos.xyz | mundialpet-tunnel | Proxied | Auto |
| **Tunnel** | **nala-api** | **mundialpet-tunnel** | **Proxied** | **Auto** |

## 🔧 Paso 3: Actualizar Configuración del Túnel

Después de agregar el DNS, ejecuta el script para actualizar la configuración del túnel:

```powershell
cd "C:\Proyectos Jean Git\nala-api"
.\configurar-tunnel-cloudflare.ps1
```

Este script:
- ✅ Agrega `nala-api.patasypelos.xyz` al archivo de configuración del túnel
- ✅ Configura el puerto (por defecto 3000)
- ✅ Hace backup de la configuración actual
- ✅ No afecta los registros existentes (`api` y `patasypelos.xyz`)

## 🔄 Paso 4: Reiniciar el Túnel

Después de actualizar la configuración, reinicia el servicio de Cloudflare Tunnel:

### Si está corriendo como servicio de Windows:
```powershell
Restart-Service cloudflared
```

### Si está corriendo manualmente:
1. Detener el proceso actual:
   ```powershell
   Stop-Process -Name cloudflared -Force
   ```

2. Iniciar nuevamente:
   ```powershell
   cd $env:USERPROFILE\.cloudflared
   cloudflared tunnel run TU_TUNNEL_ID
   ```

## 🧪 Paso 5: Probar la API

Una vez configurado, prueba que la API responda:

```bash
# Probar endpoint de registro
curl https://nala-api.patasypelos.xyz/auth/register

# O desde el navegador
https://nala-api.patasypelos.xyz/auth/register
```

## ⚠️ Notas Importantes

1. **No afecta lo existente:** El nuevo registro DNS es independiente y no modifica `api.patasypelos.xyz` ni `patasypelos.xyz`

2. **Mismo túnel:** Todos los subdominios usan el mismo túnel (`mundialpet-tunnel`), pero apuntan a diferentes puertos en localhost:
   - `patasypelos.xyz` → `localhost:80`
   - `api.patasypelos.xyz` → `localhost:80` (con hostname header)
   - `nala-api.patasypelos.xyz` → `localhost:3000` (o el puerto que configuraste)

3. **Propagación DNS:** Los cambios pueden tardar unos minutos en propagarse (generalmente menos de 1 minuto con Cloudflare)

4. **Proxy Status:** Asegúrate de que esté en "Proxied" (naranja) para que funcione el túnel

## 🔍 Solución de Problemas

### El DNS no resuelve
- Verifica que el registro esté guardado en Cloudflare
- Espera 1-2 minutos para la propagación
- Verifica que el proxy esté activado (naranja)

### El túnel no conecta
- Verifica que el servicio cloudflared esté corriendo
- Revisa los logs del túnel
- Verifica que la configuración del túnel incluya `nala-api.patasypelos.xyz`

### Error 502 o 503
- Verifica que el sitio `nala-api` esté corriendo en IIS
- Verifica que el puerto en IIS coincida con el configurado en el túnel
- Revisa los logs de IIS

## 📚 Referencias

- [Documentación de Cloudflare Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Guía de Publicación en IIS](./PUBLICACION_IIS.md)
- [Inicio Rápido IIS](./INICIO_RAPIDO_IIS.md)
