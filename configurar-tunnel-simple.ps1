# Script simplificado para agregar nala-api al tunel de Cloudflare
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AGREGAR NALA API A CLOUDFLARE TUNNEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$userProfile = $env:USERPROFILE
$configPath = Join-Path $userProfile ".cloudflared\config.yml"
$configDir = Split-Path $configPath

Write-Host "[1] Verificando configuracion actual..." -ForegroundColor Yellow

if (-not (Test-Path $configDir)) {
    Write-Host "  Creando directorio: $configDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

if (-not (Test-Path $configPath)) {
    Write-Host "  [ERROR] No se encontro el archivo de configuracion del tunel" -ForegroundColor Red
    Write-Host "    Ubicacion esperada: $configPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "  Config encontrado: $configPath" -ForegroundColor Green

# Hacer backup
$backupPath = "$configPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item -Path $configPath -Destination $backupPath -Force
Write-Host "  Backup creado: $backupPath" -ForegroundColor Green

# Leer configuracion actual
$currentConfig = Get-Content $configPath -Raw

if ($currentConfig -match "nala-api\.patasypelos\.xyz") {
    Write-Host ""
    Write-Host "  [INFO] nala-api.patasypelos.xyz ya esta configurado" -ForegroundColor Yellow
    $overwrite = Read-Host "  Deseas actualizar la configuracion? (S/N)"
    if ($overwrite -ne "S" -and $overwrite -ne "s") {
        Write-Host "  Operacion cancelada" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "[2] Obteniendo informacion del tunel..." -ForegroundColor Yellow

$tunnelId = $null
if ($currentConfig -match "tunnel:\s*([a-f0-9-]+)") {
    $tunnelId = $matches[1]
    Write-Host "  Tunnel ID detectado: $tunnelId" -ForegroundColor Green
} else {
    Write-Host "  No se pudo detectar el ID del tunnel" -ForegroundColor Yellow
    $tunnelId = Read-Host "  Ingresa el ID del tunnel (mundialpet-tunnel)"
    if ([string]::IsNullOrWhiteSpace($tunnelId)) {
        Write-Host "  [ERROR] ID del tunnel requerido" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "[3] Configurando puerto para nala-api..." -ForegroundColor Yellow

$port = Read-Host "  Puerto donde corre nala-api en IIS (Enter para 3000)"
if ([string]::IsNullOrWhiteSpace($port)) {
    $port = "3000"
}

Write-Host "  Puerto configurado: $port" -ForegroundColor Green

Write-Host ""
Write-Host "[4] Actualizando configuracion del tunel..." -ForegroundColor Yellow

# Leer el archivo linea por linea
$lines = Get-Content $configPath
$newLines = @()
$nalaApiAdded = $false
$catchAllFound = $false

foreach ($line in $lines) {
    if ($line -match "service:\s*http_status:404" -and -not $nalaApiAdded) {
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

Set-Content -Path $configPath -Value $newLines -Encoding UTF8
Write-Host "  Configuracion actualizada en: $configPath" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACION COMPLETA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Reiniciar el servicio cloudflared:" -ForegroundColor White
Write-Host "   Restart-Service cloudflared" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verificar que el sitio nala-api este corriendo en IIS en el puerto $port" -ForegroundColor White
Write-Host ""
Write-Host "3. Probar la API:" -ForegroundColor White
Write-Host "   https://nala-api.patasypelos.xyz/auth/register" -ForegroundColor Gray
Write-Host ""
Write-Host "Configuracion guardada en: $configPath" -ForegroundColor Cyan
Write-Host "Backup en: $backupPath" -ForegroundColor Cyan
Write-Host ""
pause
