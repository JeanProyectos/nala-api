# Script para instalar modulos IIS necesarios para proxy reverso
# Ejecutar como Administrador

$ErrorActionPreference = 'Stop'

Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  INSTALAR MODULOS IIS PARA PROXY' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).
    IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host '[ERROR] Este script debe ejecutarse como Administrador' -ForegroundColor Red
    exit 1
}

$tempDir = Join-Path $env:TEMP 'iis-modules'
$rewriteUrl = 'https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi'
$arrDocsUrl = 'https://www.iis.net/downloads/microsoft/application-request-routing'
$rewriteMsi = Join-Path $tempDir 'rewrite_amd64_en-US.msi'
$webConfigPath = 'C:\inetpub\wwwroot\nala-api\web.config'

function Download-File {
    param(
        [string]$Url,
        [string]$OutputPath
    )

    Write-Host ('[INFO] Descargando ' + $Url) -ForegroundColor Yellow
    Invoke-WebRequest -Uri $Url -OutFile $OutputPath -UseBasicParsing
    Write-Host ('[OK] Descargado ' + $OutputPath) -ForegroundColor Green
}

function Install-MsiPackage {
    param(
        [string]$MsiPath,
        [string]$DisplayName
    )

    Write-Host ('[INFO] Instalando ' + $DisplayName) -ForegroundColor Yellow
    $args = '/i "{0}" /quiet /norestart' -f $MsiPath
    $process = Start-Process -FilePath 'msiexec.exe' -ArgumentList $args -Wait -PassThru -NoNewWindow

    if ($process.ExitCode -ne 0) {
        throw ('No se pudo instalar ' + $DisplayName + '. ExitCode: ' + $process.ExitCode)
    }

    Write-Host ('[OK] Instalado ' + $DisplayName) -ForegroundColor Green
}

function Write-ProxyWebConfig {
    $webConfigContent = @'
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
          <action type="Rewrite" url="http://localhost:3001/{R:0}" />
        </rule>
      </rules>
    </rewrite>
    <urlCompression doStaticCompression="false" doDynamicCompression="false" />
  </system.webServer>
</configuration>
'@

    Set-Content -Path $webConfigPath -Value $webConfigContent -Encoding UTF8
    Write-Host '[OK] web.config actualizado para proxy a localhost:3001' -ForegroundColor Green
}

Write-Host '[1] Preparando carpeta temporal...' -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Write-Host '[2] Descargando modulos IIS...' -ForegroundColor Cyan
Download-File -Url $rewriteUrl -OutputPath $rewriteMsi

Write-Host '[3] Instalando modulos...' -ForegroundColor Cyan
Install-MsiPackage -MsiPath $rewriteMsi -DisplayName 'IIS URL Rewrite Module'
Start-Sleep -Seconds 2
Write-Host '[WARN] ARR ya no tiene un enlace MSI directo confiable desde Microsoft.' -ForegroundColor Yellow
Write-Host ('[WARN] Instalalo manualmente desde: ' + $arrDocsUrl) -ForegroundColor Yellow
Write-Host '[WARN] Despues de instalar ARR, vuelve a ejecutar este script.' -ForegroundColor Yellow
exit 1

Write-Host '[4] Reiniciando IIS...' -ForegroundColor Cyan
iisreset | Out-Null
Write-Host '[OK] IIS reiniciado' -ForegroundColor Green

Write-Host '[5] Intentando habilitar proxy en ARR...' -ForegroundColor Cyan
try {
    Import-Module WebAdministration -ErrorAction Stop
    Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/proxy' -Name 'enabled' -Value $true
    Write-Host '[OK] Proxy habilitado en ARR' -ForegroundColor Green
} catch {
    Write-Host '[WARN] No se pudo habilitar ARR automaticamente. Hazlo desde IIS Manager.' -ForegroundColor Yellow
}

Write-Host '[6] Actualizando web.config...' -ForegroundColor Cyan
Write-ProxyWebConfig

Write-Host '[7] Limpiando temporales...' -ForegroundColor Cyan
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host '[OK] Limpieza completada' -ForegroundColor Green

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  INSTALACION COMPLETADA' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Siguiente paso:' -ForegroundColor Yellow
Write-Host '1. Inicia el backend publicado:' -ForegroundColor Gray
Write-Host '   cd C:\inetpub\wwwroot\nala-api' -ForegroundColor Gray
Write-Host '   & "C:\Program Files\nodejs\node.exe" "dist\src\main.js"' -ForegroundColor Gray
