# Solución Error HTTP 500.19 - Código 0x8007000d

## Problema
El error `0x8007000d` indica que IIS no puede procesar el `web.config` porque falta el **módulo URL Rewrite**.

## Solución 1: Instalar URL Rewrite Module (Recomendado)

### Paso 1: Descargar e Instalar
1. Descarga el módulo desde: https://www.iis.net/downloads/microsoft/url-rewrite
2. O descarga directa: https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi
3. Ejecuta el instalador como administrador
4. Reinicia IIS después de la instalación

### Paso 2: Verificar Instalación
1. Abre el **Administrador de IIS** (ejecuta `inetmgr` como administrador)
2. Selecciona el servidor en el panel izquierdo
3. Haz doble clic en **"Módulos"**
4. Verifica que **"RewriteModule"** aparezca en la lista

### Paso 3: Reiniciar IIS
```powershell
# Ejecutar como administrador
iisreset
```

## Solución 2: Web.config sin URL Rewrite (Temporal)

Si no puedes instalar el módulo ahora, puedes usar un `web.config` mínimo:

1. **Renombra** el `web.config` actual:
   ```powershell
   Rename-Item C:\inetpub\wwwroot\nala-api\web.config C:\inetpub\wwwroot\nala-api\web.config.backup
   ```

2. **Copia** el archivo mínimo:
   ```powershell
   Copy-Item C:\Proyectos Jean Git\nala-api\web.config.minimal C:\inetpub\wwwroot\nala-api\web.config
   ```

**Nota:** Con esta solución, IIS NO hará proxy a Node.js. Tendrás que acceder directamente a Node.js en `http://localhost:3000` (si Node.js está corriendo en ese puerto).

## Solución 3: Verificar Configuración del Sitio IIS

El problema también puede ser que IIS esté escuchando en el puerto 3000, lo cual crearía un conflicto.

1. Abre el **Administrador de IIS**
2. Selecciona tu sitio web
3. Haz clic en **"Enlaces"** en el panel derecho
4. Verifica en qué puerto está escuchando el sitio
5. Si está en el puerto 3000, cámbialo a otro puerto (ej: 80, 8080, etc.)

## Verificar que Node.js está corriendo

```powershell
netstat -ano | findstr :3000
```

Si Node.js está corriendo, deberías ver algo como:
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       [PID]
```

## Después de aplicar la solución

1. Reinicia IIS: `iisreset`
2. Prueba acceder a: `http://localhost:3000/` (o el puerto que configuraste)
3. Si aún hay errores, revisa el **Visor de eventos de Windows** para más detalles
