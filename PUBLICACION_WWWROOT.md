# 📦 Publicación en C:\inetpub\wwwroot

Esta guía explica cómo publicar NALA API en `C:\inetpub\wwwroot\nala-api` separando la publicación del código de desarrollo.

## 🎯 Ventajas de esta Separación

- ✅ **Código fuente separado**: El código de desarrollo queda en `C:\Proyectos Jean Git\nala-api`
- ✅ **Publicación limpia**: Solo archivos necesarios en `C:\inetpub\wwwroot\nala-api`
- ✅ **Fácil actualización**: Solo copiar archivos compilados
- ✅ **Mejor organización**: Separación clara entre desarrollo y producción

## 🚀 Proceso de Publicación

### Paso 1: Compilar el Proyecto

```powershell
cd "C:\Proyectos Jean Git\nala-api"
npm run build
```

### Paso 2: Publicar en wwwroot

```powershell
cd "C:\Proyectos Jean Git\nala-api"
.\publicar-en-wwwroot.ps1
```

Este script:
- ✅ Compila el proyecto si no está compilado
- ✅ Copia solo archivos necesarios a `C:\inetpub\wwwroot\nala-api`
- ✅ Configura permisos para IIS
- ✅ Actualiza la configuración del sitio IIS

### Paso 3: Iniciar Node.js desde Producción

```powershell
cd "C:\inetpub\wwwroot\nala-api"
.\iniciar-node-produccion.ps1
```

O manualmente:
```powershell
cd "C:\inetpub\wwwroot\nala-api"
node dist\src\main.js
```

### Paso 4: Iniciar Sitio en IIS

1. Abrir **IIS Manager**
2. Click derecho en `nala-api` → **Start**

## 📁 Estructura de Carpetas

### Código de Desarrollo
```
C:\Proyectos Jean Git\nala-api\
├── src\              # Código fuente TypeScript
├── test\             # Tests
├── dist\             # Código compilado (temporal)
├── node_modules\      # Dependencias
├── .env              # Variables de entorno
├── web.config        # Configuración IIS
└── package.json      # Configuración npm
```

### Publicación (wwwroot)
```
C:\inetpub\wwwroot\nala-api\
├── dist\             # Código compilado (solo esto)
├── node_modules\     # Dependencias (solo esto)
├── uploads\          # Archivos subidos
├── web.config        # Configuración IIS
├── .env              # Variables de entorno producción
├── package.json      # (solo referencia)
└── package-lock.json # (solo referencia)
```

## 🔄 Actualizar la Publicación

Cuando hagas cambios en el código:

1. **Compilar:**
   ```powershell
   cd "C:\Proyectos Jean Git\nala-api"
   npm run build
   ```

2. **Publicar:**
   ```powershell
   .\publicar-en-wwwroot.ps1
   ```

3. **Reiniciar Node.js:**
   ```powershell
   # Detener proceso actual
   Get-Process -Name node | Stop-Process -Force
   
   # Iniciar desde producción
   cd "C:\inetpub\wwwroot\nala-api"
   .\iniciar-node-produccion.ps1
   ```

## ⚙️ Configuración IIS

El sitio IIS está configurado para:
- **Physical Path:** `C:\inetpub\wwwroot\nala-api`
- **Application Pool:** `nala-api-pool`
- **Puerto:** `3000`
- **Tipo:** Proxy reverso a Node.js

## 🔧 Archivos Copiados

El script `publicar-en-wwwroot.ps1` copia:

- ✅ `dist/` - Código compilado
- ✅ `node_modules/` - Dependencias
- ✅ `uploads/` - Archivos subidos (si existe)
- ✅ `web.config` - Configuración IIS
- ✅ `.env` - Variables de entorno
- ✅ `package.json` - Para referencia
- ✅ `package-lock.json` - Para referencia

**NO copia:**
- ❌ `src/` - Código fuente
- ❌ `test/` - Tests
- ❌ `.git/` - Control de versiones
- ❌ Archivos de desarrollo

## 📝 Variables de Entorno

**IMPORTANTE:** Verifica que el archivo `.env` en `C:\inetpub\wwwroot\nala-api` tenga la configuración correcta para producción:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/nala"
JWT_SECRET="tu_secret_key_segura_produccion"
PORT=3000
NODE_ENV=production
```

## 🚨 Solución de Problemas

### Error: "Carpeta no encontrada"
- Verifica que el script se ejecute como Administrador
- Verifica que la ruta `C:\inetpub\wwwroot` exista

### Error: "Node.js no responde"
- Verifica que Node.js esté corriendo: `Get-Process -Name node`
- Verifica el puerto: `netstat -ano | findstr ":3000"`
- Revisa los logs en la consola donde iniciaste Node.js

### Error: "Permisos denegados"
- Ejecuta el script como Administrador
- Verifica permisos de la carpeta `C:\inetpub\wwwroot\nala-api`

## 📚 Scripts Disponibles

- `publicar-en-wwwroot.ps1` - Publica el proyecto en wwwroot
- `iniciar-node-produccion.ps1` - Inicia Node.js desde producción
- `crear-sitio-iis.ps1` - Crea el sitio IIS (ya configurado para wwwroot)

## ✅ Verificación Final

1. ✅ Código compilado en `C:\Proyectos Jean Git\nala-api\dist`
2. ✅ Archivos copiados a `C:\inetpub\wwwroot\nala-api`
3. ✅ Node.js corriendo desde producción
4. ✅ Sitio IIS iniciado
5. ✅ API responde en `http://localhost:3000`
6. ✅ API pública responde en `https://nala-api.patasypelos.xyz`

---

**✅ Con esta configuración, tienes una separación clara entre desarrollo y producción.**
