# Script para Agregar NALA API al Túnel de Cloudflare Existente
# Este script agrega nala-api.patasypelos.xyz al túnel mundialpet-tunnel sin afectar lo existente
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AGREGAR NALA API A CLOUDFLARE TUNNEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$userProfile = $env:USERPROFILE
$configPath = Join-Path $userProfile ".cloudflared\config.yml"
$configDir = Split-Path $configPath

Write-Host "[1] Verificando configuración actual del túnel..." -ForegroundColor Yellow

# Crear directorio si no existe
if (-not (Test-Path $configDir)) {
    Write-Host "  Creando directorio: $configDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

# Verificar si existe configuración
if (-not (Test-Path $configPath)) {
    Write-Host "  [ERROR] No se encontró el archivo de configuración del túnel" -ForegroundColor Red
    Write-Host "    Ubicación esperada: $configPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Primero debes configurar el túnel base ejecutando:" -ForegroundColor Yellow
    Write-Host "    C:\Proyectos Jean Git\mundialApiPetProduccion\configurar-tunnel-cloudflare.ps1" -ForegroundColor Gray
    exit 1
}

Write-Host "  Config encontrado: $configPath" -ForegroundColor Green

# Hacer backup
$backupPath = "$configPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item -Path $configPath -Destination $backupPath -Force
Write-Host "  Backup creado: $backupPath" -ForegroundColor Green

# Leer configuración actual
$currentConfig = Get-Content $configPath -Raw
Write-Host ""
Write-Host "  Configuración actual:" -ForegroundColor Cyan
Get-Content $configPath | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }

# Verificar si ya existe nala-api
if ($currentConfig -match "nala-api\.patasypelos\.xyz") {
    Write-Host ""
    Write-Host "  [INFO] nala-api.patasypelos.xyz ya está configurado" -ForegroundColor Yellow
    $overwrite = Read-Host "  ¿Deseas actualizar la configuración? (S/N)"
    if ($overwrite -ne "S" -and $overwrite -ne "s") {
        Write-Host "  Operación cancelada" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "[2] Obteniendo información del túnel..." -ForegroundColor Yellow

# Intentar obtener el ID del tunnel
$tunnelId = $null
try {
    $tunnelList = & cloudflared tunnel list 2>&1
    if ($LASTEXITCODE -eq 0 -and $tunnelList) {
        # Buscar mundialpet-tunnel
        $tunnelLine = $tunnelList | Select-String -Pattern "mundialpet-tunnel"
        if ($tunnelLine) {
            if ($tunnelLine -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})') {
                $tunnelId = $matches[1]
                Write-Host "  Tunnel ID detectado: $tunnelId" -ForegroundColor Green
            }
        }
    }
} catch {
    Write-Host "  cloudflared no está en el PATH" -ForegroundColor Yellow
}

# Si no se detectó, intentar extraer del config
if (-not $tunnelId) {
    if ($currentConfig -match "tunnel:\s*([a-f0-9-]+)") {
        $tunnelId = $matches[1]
        Write-Host "  Tunnel ID extraído del config: $tunnelId" -ForegroundColor Green
    } else {
        Write-Host "  No se pudo detectar el ID del tunnel" -ForegroundColor Yellow
        $tunnelId = Read-Host "  Ingresa el ID del tunnel (mundialpet-tunnel)"
        if ([string]::IsNullOrWhiteSpace($tunnelId)) {
            Write-Host "  [ERROR] ID del tunnel requerido" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "[3] Configurando puerto para nala-api..." -ForegroundColor Yellow

# Preguntar el puerto (por defecto 3000)
$port = Read-Host "  Puerto donde corre nala-api en IIS (Enter para 3000)"
if ([string]::IsNullOrWhiteSpace($port)) {
    $port = "3000"
}

Write-Host "  Puerto configurado: $port" -ForegroundColor Green

Write-Host ""
Write-Host "[4] Actualizando configuración del túnel..." -ForegroundColor Yellow

# Leer el archivo línea por línea para preservar el formato
$lines = Get-Content $configPath
$newLines = @()
$nalaApiAdded = $false
$catchAllFound = $false

foreach ($line in $lines) {
    # Si encontramos la regla catch-all, agregar nala-api antes
    if ($line -match "service:\s*http_status:404" -and -not $nalaApiAdded) {
        # Agregar configuración de nala-api antes del catch-all
        $newLines += "  # NALA API - nala-api.patasypelos.xyz"
        $newLines += "  - hostname: nala-api.patasypelos.xyz"
        $newLines += "    service: http://localhost:$port"
        $newLines += "    originRequest:"
        $newLines += "      httpHostHeader: nala-api.patasypelos.xyz"
        $newLines += ""
        $nalaApiAdded = $true
        $catchAllFound = $true
    }
    
    $newLines += $line
}

# Si no se encontró el catch-all, agregar al final
if (-not $catchAllFound) {
    $newLines += ""
    $newLines += "  # NALA API - nala-api.patasypelos.xyz"
    $newLines += "  - hostname: nala-api.patasypelos.xyz"
    $newLines += "    service: http://localhost:$port"
    $newLines += "    originRequest:"
    $newLines += "      httpHostHeader: nala-api.patasypelos.xyz"
    $newLines += ""
    $newLines += "  # Catch-all rule (debe estar al final)"
    $newLines += "  - service: http_status:404"
}

# Guardar nueva configuración
Set-Content -Path $configPath -Value $newLines -Encoding UTF8
Write-Host "  Configuración actualizada en: $configPath" -ForegroundColor Green

Write-Host ""
Write-Host "[5] Verificando configuración de IIS..." -ForegroundColor Yellow
Import-Module WebAdministration -ErrorAction SilentlyContinue

# Verificar si existe el sitio nala-api
$site = Get-Website -Name "nala-api" -ErrorAction SilentlyContinue
if ($site) {
    Write-Host "  Sitio encontrado: nala-api" -ForegroundColor Green
    Write-Host "    Physical Path: $($site.physicalPath)" -ForegroundColor Cyan
    Write-Host "    Estado: $($site.State)" -ForegroundColor $(if ($site.State -eq 'Started') { 'Green' } else { 'Yellow' })
    
    $bindings = Get-WebBinding -Name "nala-api"
    Write-Host "    Bindings:" -ForegroundColor Cyan
    foreach ($binding in $bindings) {
        Write-Host "      $($binding.protocol)://$($binding.bindingInformation)" -ForegroundColor Gray
    }
    
    # Verificar que el puerto sea correcto
    $portPattern = "*:" + $port + ":*"
    $hasCorrectPort = $bindings | Where-Object { $_.bindingInformation -like $portPattern }
    if (-not $hasCorrectPort) {
        Write-Host ""
        Write-Host "  ⚠ ADVERTENCIA: El sitio no tiene un binding en el puerto $port" -ForegroundColor Yellow
        Write-Host "    Asegúrate de configurar el binding correcto en IIS" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Sitio 'nala-api' no encontrado en IIS" -ForegroundColor Yellow
    Write-Host "    Asegúrate de crear el sitio siguiendo PUBLICACION_IIS.md" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACIÓN COMPLETA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Agregar registro DNS en Cloudflare:" -ForegroundColor White
Write-Host "   - Tipo: CNAME o Tunnel" -ForegroundColor Gray
Write-Host "   - Nombre: nala-api" -ForegroundColor Gray
Write-Host "   - Contenido: mundialpet-tunnel" -ForegroundColor Gray
Write-Host "   - Proxy: Proxied (naranja)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Reiniciar el servicio cloudflared:" -ForegroundColor White
Write-Host "   Restart-Service cloudflared" -ForegroundColor Gray
Write-Host "   O si está corriendo manualmente, reinícialo" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verificar que el sitio nala-api esté corriendo en IIS en el puerto $port" -ForegroundColor White
Write-Host ""
Write-Host "4. Probar la API:" -ForegroundColor White
Write-Host "   https://nala-api.patasypelos.xyz/auth/register" -ForegroundColor Gray
Write-Host ""
Write-Host "Configuracion guardada en: $configPath" -ForegroundColor Cyan
$backupMsg = "Backup disponible en: $backupPath"
Write-Host $backupMsg -ForegroundColor Cyan
Write-Host ""
pause
