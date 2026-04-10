# 📊 Resumen de Configuración - NALA API

## 🎯 Objetivo

Publicar `nala-api` en IIS y exponerla públicamente mediante Cloudflare Tunnel **sin afectar** los proyectos existentes.

## 🔄 Flujo de Configuración

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE DNS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  patasypelos.xyz        → mundialpet-tunnel                 │
│  api.patasypelos.xyz    → mundialpet-tunnel                 │
│  nala-api.patasypelos.xyz → mundialpet-tunnel  [NUEVO]      │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE TUNNEL (mundialpet-tunnel)           │
│              Archivo: ~/.cloudflared/config.yml              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  patasypelos.xyz        → localhost:80                       │
│  api.patasypelos.xyz    → localhost:80                       │
│  nala-api.patasypelos.xyz → localhost:3000  [NUEVO]         │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    IIS (Windows Server)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Sitio: patasypelos.xyz    → Puerto 80                      │
│  Sitio: api.patasypelos.xyz → Puerto 80                     │
│  Sitio: nala-api            → Puerto 3000  [NUEVO]           │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    APLICACIONES                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend/Backend existente                                 │
│  API existente (mundialApiPetProduccion)                    │
│  NALA API (NestJS)                    [NUEVO]              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Archivos Creados

### Para IIS:
- ✅ `web.config` - Configuración de IIS para Node.js
- ✅ `PUBLICACION_IIS.md` - Guía completa de publicación
- ✅ `INICIO_RAPIDO_IIS.md` - Resumen rápido
- ✅ `build-iis.ps1` - Script de build automatizado

### Para Cloudflare Tunnel:
- ✅ `configurar-tunnel-cloudflare.ps1` - Script para agregar al túnel
- ✅ `CONFIGURAR_DNS_CLOUDFLARE.md` - Guía de DNS
- ✅ `INICIO_RAPIDO_TUNNEL.md` - Resumen rápido del túnel

## 🚀 Pasos de Implementación

### 1. Publicar en IIS
```powershell
cd "C:\Proyectos Jean Git\nala-api"
.\build-iis.ps1
# Luego configurar IIS siguiendo PUBLICACION_IIS.md
```

### 2. Agregar DNS en Cloudflare
- Ve a: https://dash.cloudflare.com/4d946dcff804ca30bd621c48a5ff3419/patasypelos.xyz/dns/records
- Agrega registro: `nala-api` → `mundialpet-tunnel` (Tipo: Tunnel, Proxy: Proxied)

### 3. Configurar Túnel
```powershell
.\configurar-tunnel-cloudflare.ps1
```

### 4. Reiniciar Túnel
```powershell
Restart-Service cloudflared
```

## ✅ Verificación Final

| Componente | Estado | URL/Ubicación |
|------------|--------|---------------|
| IIS Site | ✅ Corriendo | `localhost:3000` |
| DNS Cloudflare | ✅ Configurado | `nala-api.patasypelos.xyz` |
| Túnel Config | ✅ Actualizado | `~/.cloudflared/config.yml` |
| Túnel Service | ✅ Corriendo | `cloudflared` |
| API Pública | ✅ Accesible | `https://nala-api.patasypelos.xyz` |

## 🔒 Seguridad

- ✅ Cada aplicación corre en su propio sitio IIS
- ✅ Cada aplicación usa su propio puerto
- ✅ El túnel maneja SSL/TLS automáticamente
- ✅ Cloudflare protege contra DDoS
- ✅ No se exponen puertos directamente al internet

## ⚠️ Importante

1. **No afecta proyectos existentes:**
   - `api.patasypelos.xyz` sigue funcionando igual
   - `patasypelos.xyz` sigue funcionando igual
   - Solo se agrega `nala-api.patasypelos.xyz`

2. **Mismo túnel, diferentes puertos:**
   - Todos usan `mundialpet-tunnel`
   - Cada uno apunta a un puerto diferente en localhost
   - El túnel enruta según el hostname

3. **Configuración independiente:**
   - Cada sitio IIS es independiente
   - Cada aplicación tiene su propio `.env`
   - Los cambios en uno no afectan a los otros

## 📚 Documentación

- **IIS:** `PUBLICACION_IIS.md` o `INICIO_RAPIDO_IIS.md`
- **Túnel:** `CONFIGURAR_DNS_CLOUDFLARE.md` o `INICIO_RAPIDO_TUNNEL.md`
- **Build:** Ejecutar `build-iis.ps1`

## 🆘 Solución de Problemas

### La API no responde
1. Verifica que el sitio IIS esté iniciado
2. Verifica que el puerto sea correcto (3000)
3. Revisa los logs de IIS

### El DNS no funciona
1. Verifica que el registro esté en Cloudflare
2. Espera 1-2 minutos para propagación
3. Verifica que el proxy esté activado (naranja)

### El túnel no conecta
1. Verifica que el servicio cloudflared esté corriendo
2. Revisa la configuración en `~/.cloudflared/config.yml`
3. Reinicia el servicio: `Restart-Service cloudflared`

---

**✅ Todo está listo para publicar nala-api sin afectar otros proyectos**
