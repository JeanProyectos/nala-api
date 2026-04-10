# ⚡ Inicio Rápido - Publicación en IIS

## 🚀 Pasos Rápidos

### 1. Preparar el Proyecto
```powershell
cd "C:\Proyectos Jean Git\nala-api"
.\build-iis.ps1
```

### 2. Configurar IIS

1. **Abrir IIS Manager**
2. **Crear nuevo sitio:**
   - Click derecho en **Sites** → **Add Website**
   - **Name:** `nala-api`
   - **Physical path:** `C:\Proyectos Jean Git\nala-api`
   - **Port:** `3000` (o el que prefieras)
   - **Application Pool:** Crear nuevo

3. **Configurar Application Pool:**
   - **.NET CLR Version:** No Managed Code
   - **Start Mode:** AlwaysRunning

4. **Configurar permisos:**
   - Agregar `IIS_IUSRS` y `IIS AppPool\nala-api` con permisos de lectura

### 3. Instalar iisnode (Si no está instalado)

**Opción A - Con npm:**
```powershell
npm install -g iisnode
iisreset
```

**Opción B - Descargar:**
- https://github.com/Azure/iisnode/releases
- Instalar y reiniciar IIS

### 4. Iniciar el Sitio

1. En IIS Manager, seleccionar `nala-api`
2. Click en **Start**
3. Probar: `http://localhost:3000/auth/register`

## ✅ Verificación

- ✅ `dist/main.js` existe
- ✅ `web.config` existe
- ✅ `.env` configurado
- ✅ iisnode instalado
- ✅ Permisos configurados
- ✅ Application Pool iniciado

## 📚 Documentación Completa

Ver `PUBLICACION_IIS.md` para instrucciones detalladas.
