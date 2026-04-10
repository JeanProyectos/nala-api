# 🚀 Guía de Publicación en IIS - NALA API

Esta guía te ayudará a publicar la API NALA en IIS sin afectar otros proyectos.

## 📋 Requisitos Previos

1. **Node.js instalado** (versión 18 o superior recomendada)
2. **IIS instalado y configurado** en Windows
3. **URL Rewrite Module** para IIS (descargar desde [Microsoft](https://www.iis.net/downloads/microsoft/url-rewrite))
4. **iisnode** instalado (opcional, pero recomendado para mejor rendimiento)

## 🔧 Paso 1: Instalar iisnode (Recomendado)

### Opción A: Instalación con npm (Recomendado para desarrollo)
```powershell
npm install -g iisnode
```

### Opción B: Instalación manual
1. Descargar iisnode desde: https://github.com/Azure/iisnode/releases
2. Ejecutar el instalador
3. Reiniciar IIS: `iisreset`

## 🔧 Paso 2: Preparar el Proyecto para Producción

### 2.1. Compilar el proyecto
```powershell
cd "C:\Proyectos Jean Git\nala-api"
npm install
npm run build
```

### 2.2. Verificar que existe la carpeta `dist`
Asegúrate de que después del build exista `dist/main.js`

### 2.3. Configurar variables de entorno
Crea o verifica el archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/nala"
JWT_SECRET="tu_secret_key_segura_aqui"
PORT=3000
NODE_ENV=production
```

**⚠️ IMPORTANTE:** En IIS, el puerto se configurará en el sitio web, pero mantener PORT en .env como respaldo.

## 🔧 Paso 3: Configurar IIS

### 3.1. Crear un Nuevo Sitio Web en IIS

1. Abrir **IIS Manager** (InetMgr.exe)
2. Click derecho en **Sites** → **Add Website**
3. Configurar:
   - **Site name:** `nala-api` (o el nombre que prefieras)
   - **Application pool:** Crear nuevo (recomendado) o usar uno existente
   - **Physical path:** `C:\Proyectos Jean Git\nala-api`
   - **Binding:**
     - **Type:** http
     - **IP address:** All Unassigned (o una IP específica)
     - **Port:** 3000 (o el puerto que prefieras, diferente a otros proyectos)
     - **Host name:** (dejar vacío o usar un dominio si tienes)

4. Click **OK**

### 3.2. Configurar Application Pool

1. En IIS Manager, ir a **Application Pools**
2. Seleccionar el pool creado para `nala-api`
3. Click derecho → **Advanced Settings**
4. Configurar:
   - **.NET CLR Version:** No Managed Code
   - **Managed Pipeline Mode:** Integrated
   - **Start Mode:** AlwaysRunning (recomendado)
   - **Idle Time-out:** 0 (para que no se detenga)
   - **Identity:** ApplicationPoolIdentity (o una cuenta con permisos)

### 3.3. Configurar Permisos

1. Click derecho en la carpeta del proyecto → **Properties** → **Security**
2. Agregar permisos para:
   - **IIS_IUSRS** (Read & Execute, List folder contents, Read)
   - **IIS AppPool\nala-api** (Read & Execute, List folder contents, Read)
   - **Tu usuario de Windows** (Full Control, para poder actualizar archivos)

### 3.4. Verificar web.config

El archivo `web.config` ya está creado en la raíz del proyecto. Verifica que:
- Apunta a `dist/main.js`
- Tiene la configuración correcta de iisnode

## 🔧 Paso 4: Configuración Adicional (Opcional pero Recomendado)

### 4.1. Configurar Variables de Entorno en IIS

1. En IIS Manager, seleccionar el sitio `nala-api`
2. Doble click en **Configuration Editor**
3. Ir a `system.webServer/iisnode`
4. Configurar:
   - `node_env`: `production`
   - `nodeProcessCountPerApplication`: `1`

### 4.2. Configurar Logging

Los logs se guardarán en: `C:\Proyectos Jean Git\nala-api\iisnode\`

Para ver los logs:
1. Abrir IIS Manager
2. Seleccionar el sitio
3. Click en **Logging** para configurar logs de IIS

## 🔧 Paso 5: Probar la Aplicación

### 5.1. Iniciar el sitio
1. En IIS Manager, seleccionar el sitio `nala-api`
2. Click en **Start** (si no está iniciado)

### 5.2. Probar endpoints
Abrir navegador o usar Postman:
```
http://localhost:3000/auth/register
```

O si usaste otro puerto:
```
http://localhost:TU_PUERTO/auth/register
```

### 5.3. Verificar logs
Si hay errores, revisar:
- Logs de IIS: `C:\inetpub\logs\LogFiles\`
- Logs de iisnode: `C:\Proyectos Jean Git\nala-api\iisnode\`

## 🔧 Paso 6: Configuración de Firewall (Si es necesario)

Si necesitas acceso desde otras máquinas:

1. Abrir **Windows Firewall**
2. **Advanced Settings** → **Inbound Rules** → **New Rule**
3. Configurar:
   - **Rule Type:** Port
   - **Protocol:** TCP
   - **Port:** 3000 (o el puerto que configuraste)
   - **Action:** Allow
   - **Name:** NALA API

## ⚠️ Solución de Problemas Comunes

### Error: "iisnode module not found"
- Verificar que iisnode esté instalado
- Reiniciar IIS: `iisreset` en PowerShell como Administrador

### Error: "Cannot find module"
- Verificar que `node_modules` esté en la carpeta del proyecto
- Ejecutar `npm install` en la carpeta del proyecto

### Error: "Port already in use"
- Cambiar el puerto en el binding del sitio IIS
- O detener otros servicios que usen ese puerto

### La aplicación no responde
- Verificar que el Application Pool esté iniciado
- Revisar los logs en `iisnode\`
- Verificar permisos de la carpeta

### Error de base de datos
- Verificar que PostgreSQL esté corriendo
- Verificar la cadena de conexión en `.env`
- Verificar que la base de datos exista

## 📝 Notas Importantes

1. **Puerto único:** Asegúrate de usar un puerto diferente a otros proyectos (3000, 3001, etc.)

2. **Actualizaciones:** Para actualizar la aplicación:
   ```powershell
   cd "C:\Proyectos Jean Git\nala-api"
   npm run build
   # Reiniciar el Application Pool en IIS
   ```

3. **Variables de entorno:** El archivo `.env` debe estar en la raíz del proyecto

4. **Archivos estáticos:** La carpeta `uploads` debe tener permisos de escritura para que la API pueda guardar archivos

5. **CORS:** Si necesitas cambiar los orígenes permitidos, edita `src/main.ts` y recompila

## 🔄 Reiniciar la Aplicación

Para reiniciar la aplicación después de cambios:

1. **Método 1:** En IIS Manager, click derecho en el Application Pool → **Recycle**
2. **Método 2:** En PowerShell (como Admin):
   ```powershell
   iisreset
   ```

## 📞 Soporte

Si tienes problemas, revisa:
- Logs de IIS
- Logs de iisnode en la carpeta del proyecto
- Event Viewer de Windows

## 🌐 Publicar con Cloudflare Tunnel (Opcional)

Si quieres exponer la API públicamente usando Cloudflare Tunnel:

1. **Agregar DNS en Cloudflare:**
   - Ver `CONFIGURAR_DNS_CLOUDFLARE.md` para instrucciones detalladas
   - O ejecutar: `.\configurar-tunnel-cloudflare.ps1`

2. **Configurar el túnel:**
   ```powershell
   .\configurar-tunnel-cloudflare.ps1
   ```

3. **Reiniciar el túnel:**
   ```powershell
   Restart-Service cloudflared
   ```

La API estará disponible en: `https://nala-api.patasypelos.xyz`

**Nota:** Esto no afecta los otros proyectos (`api.patasypelos.xyz` y `patasypelos.xyz`)

---

**✅ Una vez completados estos pasos, tu API estará disponible en IIS sin afectar otros proyectos.**
