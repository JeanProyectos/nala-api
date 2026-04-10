# 🔧 Instalar Módulos IIS para Proxy Reverso

## ⚠️ Problema Actual

El error **HTTP 500.19** se debe a que falta el **IIS URL Rewrite Module**, necesario para hacer proxy reverso a Node.js.

## ✅ Solución: Instalar Módulos Requeridos

### Paso 1: Instalar IIS URL Rewrite Module

1. **Descargar:**
   - Ve a: https://www.iis.net/downloads/microsoft/url-rewrite
   - O descarga directo: https://download.microsoft.com/download/1/2/8/128E2E22-C1EA-36DB-A847-95B842A5AE65/rewrite_amd64_en-US.msi

2. **Instalar:**
   - Ejecuta el archivo `.msi` descargado
   - Sigue el asistente de instalación
   - **Reinicia IIS** después de instalar

### Paso 2: Instalar Application Request Routing (ARR)

1. **Descargar:**
   - Ve a: https://www.iis.net/downloads/microsoft/application-request-routing
   - O descarga directo: https://download.microsoft.com/download/4/9/C/49CD28DB-4AA6-4A51-9437-AA001221F606/requestRouter_amd64.msi

2. **Instalar:**
   - Ejecuta el archivo `.msi` descargado
   - Sigue el asistente de instalación
   - **Reinicia IIS** después de instalar

### Paso 3: Habilitar Proxy en ARR

1. Abre **IIS Manager**
2. Selecciona el **servidor** (no el sitio)
3. Haz doble click en **"Application Request Routing Cache"**
4. Click en **"Server Proxy Settings"** (lado derecho)
5. Marca **"Enable proxy"**
6. Click en **"Apply"**

### Paso 4: Restaurar web.config Completo

Después de instalar los módulos, restaura el `web.config` completo con la configuración de rewrite:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="StaticFiles" stopProcessing="true">
          <match url="^(uploads|node_modules)/.*" />
          <action type="None" />
        </rule>
        
        <rule name="NodeApp" stopProcessing="true">
          <match url=".*" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="http://localhost:3000/{R:0}" />
        </rule>
      </rules>
    </rewrite>
    
    <urlCompression doStaticCompression="false" doDynamicCompression="false"/>
  </system.webServer>
</configuration>
```

### Paso 5: Reiniciar IIS

```powershell
iisreset
```

### Paso 6: Iniciar Node.js

```powershell
cd "C:\Proyectos Jean Git\nala-api"
.\iniciar-node-iis.ps1
```

## 🔍 Verificar Instalación

Para verificar que los módulos están instalados:

```powershell
Get-WebGlobalModule | Where-Object {$_.Name -like "*Rewrite*" -or $_.Name -like "*ARR*"}
```

## 📝 Nota Importante

**SÍ necesitas iniciar Node.js** en el puerto 3000. IIS solo hace proxy reverso, pero Node.js debe estar corriendo por separado.

---

**Después de instalar los módulos, el error 500.19 desaparecerá y podrás usar el proxy reverso.**
