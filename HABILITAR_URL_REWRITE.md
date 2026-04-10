# 🔧 Habilitar Módulo URL Rewrite en IIS

## Problema Actual
- IIS está escuchando en el puerto 3000
- Node.js está corriendo pero IIS intercepta las peticiones
- El `web.config` necesita el módulo URL Rewrite para hacer proxy a Node.js

## Solución: Habilitar Módulo URL Rewrite

### Paso 1: Verificar si está instalado
El módulo ya está instalado (archivo `rewrite.dll` existe), pero necesita estar **habilitado** en el sitio.

### Paso 2: Abrir Administrador de IIS
1. Presiona `Windows + R`
2. Escribe: `inetmgr`
3. Presiona Enter (ejecutar como Administrador)

### Paso 3: Habilitar el módulo en el sitio
1. En el panel izquierdo, expande el servidor
2. Expande **"Sitios"**
3. Selecciona tu sitio (probablemente **"nala-api"** o **"Default Web Site"**)
4. En el panel central, haz doble clic en **"Módulos"**
5. Busca **"RewriteModule"** en la lista
6. Si NO aparece, haz clic en **"Configurar módulos nativos..."** en el panel derecho
7. Busca **"UrlRewriteModule"** y marca la casilla
8. Haz clic en **"Aceptar"**

### Paso 4: Verificar configuración del sitio
1. Selecciona tu sitio en el panel izquierdo
2. Haz clic en **"Enlaces"** en el panel derecho
3. Verifica en qué puerto está escuchando
4. Si está en el puerto 3000, considera cambiarlo a otro puerto (80, 8080, etc.)

### Paso 5: Reiniciar IIS
```powershell
# Ejecutar como Administrador
iisreset
```

### Paso 6: Verificar
1. Accede a: `http://localhost:3000` (o el puerto que configuraste)
2. Debería hacer proxy a Node.js correctamente

## Alternativa: Cambiar puerto de Node.js

Si no puedes habilitar el módulo URL Rewrite, puedes cambiar Node.js para que escuche en otro puerto:

1. Cambia Node.js para que escuche en el puerto **3001**
2. Configura IIS para hacer proxy desde **3000** a **3001**

Pero esto requiere modificar el código de la aplicación.

## Solución Rápida Temporal

Si necesitas que funcione AHORA sin configurar IIS:

1. Accede directamente a Node.js: `http://127.0.0.1:3000` (puede que funcione)
2. O detén el sitio IIS en el puerto 3000 y accede directamente a Node.js

Pero la solución correcta es habilitar el módulo URL Rewrite en IIS.
