# 🔧 Solución Error IIS: Puerto 3000 en Uso

## ❌ Error
```
El proceso no tiene acceso al archivo porque está siendo utilizado por otro proceso.
(Excepción de HRESULT: 0x80070020)
```

## 🔍 Causa
Este error ocurre cuando:
- Node.js está corriendo directamente en el puerto 3000
- IIS intenta usar el mismo puerto 3000
- Hay un conflicto de puerto

## ✅ Solución

### Opción 1: Usar IIS con iisnode (Recomendado)

1. **Instalar iisnode:**
   ```powershell
   # Descargar desde: https://github.com/Azure/iisnode/releases
   # O instalar con npm:
   npm install -g iisnode
   ```

2. **Usar el web.config con iisnode:**
   - El archivo `web.config` ya está configurado para iisnode
   - IIS ejecutará Node.js automáticamente

3. **Iniciar el sitio en IIS:**
   - El sitio iniciará Node.js automáticamente
   - No necesitas ejecutar Node.js manualmente

### Opción 2: Usar Proxy Reverso (Sin iisnode)

1. **Detener Node.js manual:**
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```

2. **Usar web.config.simple:**
   ```powershell
   Copy-Item "C:\Proyectos Jean Git\nala-api\web.config.simple" "C:\Proyectos Jean Git\nala-api\web.config" -Force
   ```

3. **Iniciar Node.js como servicio:**
   ```powershell
   cd "C:\Proyectos Jean Git\nala-api"
   .\iniciar-node-iis.ps1
   ```

4. **Iniciar el sitio en IIS:**
   - IIS hará proxy reverso a Node.js en puerto 3000

### Opción 3: Cambiar Puerto de IIS

Si prefieres que IIS use otro puerto:

1. **En IIS Manager:**
   - Click derecho en `nala-api` → **Edit Bindings**
   - Cambiar puerto de 3000 a otro (ej: 3001)

2. **Actualizar túnel de Cloudflare:**
   - Cambiar `localhost:3000` a `localhost:3001` en `config.yml`

3. **Reiniciar túnel:**
   ```powershell
   Restart-Service cloudflared
   ```

## 🚀 Solución Rápida (Recomendada)

**Para resolver el error inmediatamente:**

```powershell
# 1. Detener todos los procesos Node.js
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Verificar que el puerto 3000 esté libre
netstat -ano | findstr ":3000"

# 3. Iniciar el sitio en IIS Manager
# (Click derecho en nala-api → Start)

# 4. Si IIS no puede ejecutar Node.js, iniciarlo manualmente:
cd "C:\Proyectos Jean Git\nala-api"
.\iniciar-node-iis.ps1
```

## 📝 Notas

- **iisnode** es la solución más robusta pero requiere instalación
- **Proxy reverso** es más simple pero requiere Node.js corriendo manualmente
- El **túnel de Cloudflare** apunta a `localhost:3000`, así que Node.js debe estar en ese puerto

## 🔄 Verificación

Después de aplicar la solución:

1. Verificar que el sitio IIS esté iniciado
2. Probar localmente: `http://localhost:3000`
3. Probar públicamente: `https://nala-api.patasypelos.xyz`
