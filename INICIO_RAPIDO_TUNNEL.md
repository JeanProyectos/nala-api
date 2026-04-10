# ⚡ Inicio Rápido - Configurar Túnel Cloudflare para NALA API

## 🚀 Pasos Rápidos

### 1. Agregar DNS en Cloudflare

1. Ve a: https://dash.cloudflare.com/4d946dcff804ca30bd621c48a5ff3419/patasypelos.xyz/dns/records
2. Click en **"Add record"**
3. Configurar:
   - **Type:** `Tunnel`
   - **Name:** `nala-api`
   - **Tunnel:** `mundialpet-tunnel`
   - **Proxy:** `Proxied` (naranja ☁️)
4. Click **"Save"**

### 2. Configurar el Túnel Local

```powershell
cd "C:\Proyectos Jean Git\nala-api"
.\configurar-tunnel-cloudflare.ps1
```

El script te pedirá:
- Puerto donde corre nala-api (por defecto: 3000)
- Confirmará el ID del túnel

### 3. Reiniciar el Túnel

```powershell
# Si está como servicio
Restart-Service cloudflared

# Si está manual
Stop-Process -Name cloudflared -Force
# Luego inicia nuevamente el túnel
```

### 4. Probar

```
https://nala-api.patasypelos.xyz/auth/register
```

## ✅ Verificación

- ✅ DNS agregado en Cloudflare
- ✅ Configuración del túnel actualizada
- ✅ Túnel reiniciado
- ✅ Sitio nala-api corriendo en IIS
- ✅ API responde en el dominio

## 📚 Documentación Completa

- **DNS:** Ver `CONFIGURAR_DNS_CLOUDFLARE.md`
- **IIS:** Ver `PUBLICACION_IIS.md`
- **Inicio Rápido IIS:** Ver `INICIO_RAPIDO_IIS.md`

## ⚠️ Importante

- El nuevo DNS **NO afecta** `api.patasypelos.xyz` ni `patasypelos.xyz`
- Todos usan el mismo túnel pero diferentes puertos
- Asegúrate de que el sitio IIS esté corriendo antes de probar
