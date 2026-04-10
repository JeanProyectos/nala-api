# Script para hacer que el túnel use el config.yml local
# Esto soluciona el problema cuando el Dashboard no permite agregar hostnames fácilmente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  USAR CONFIG LOCAL DEL TUNEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Detener el túnel actual
Write-Host "[1] Deteniendo túnel actual..." -ForegroundColor Yellow
$tunnelProcess = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
if ($tunnelProcess) {
    Write-Host "  Deteniendo proceso cloudflared (PID: $($tunnelProcess.Id))..." -ForegroundColor Gray
    Stop-Process -Name cloudflared -Force
    Start-Sleep -Seconds 3
    Write-Host "  [OK] Túnel detenido" -ForegroundColor Green
} else {
    Write-Host "  [INFO] No hay túnel corriendo" -ForegroundColor Yellow
}
Write-Host ""

# Paso 2: Verificar config.yml
Write-Host "[2] Verificando config.yml..." -ForegroundColor Yellow
$configPath = "$env:USERPROFILE\.cloudflared\config.yml"
if (Test-Path $configPath) {
    Write-Host "  [OK] config.yml encontrado: $configPath" -ForegroundColor Green
    
    # Verificar que tiene nala-api configurado
    $configContent = Get-Content $configPath -Raw
    if ($configContent -match "nala-api\.patasypelos\.xyz") {
        Write-Host "  [OK] nala-api.patasypelos.xyz está configurado" -ForegroundColor Green
    } else {
        Write-Host "  [ADVERTENCIA] nala-api.patasypelos.xyz NO está en config.yml" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [ERROR] config.yml no encontrado: $configPath" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Paso 3: Buscar cloudflared.exe
Write-Host "[3] Buscando cloudflared.exe..." -ForegroundColor Yellow
$possiblePaths = @(
    "cloudflared.exe",
    "$env:ProgramFiles\cloudflared\cloudflared.exe",
    "$env:ProgramFiles(x86)\cloudflared\cloudflared.exe",
    "$env:LOCALAPPDATA\cloudflared\cloudflared.exe",
    "$env:USERPROFILE\cloudflared\cloudflared.exe",
    "$env:USERPROFILE\AppData\Local\cloudflared\cloudflared.exe"
)

$cloudflaredPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $cloudflaredPath = $path
        Write-Host "  [OK] Encontrado en: $cloudflaredPath" -ForegroundColor Green
        break
    }
}

if (-not $cloudflaredPath) {
    Write-Host "  [ERROR] cloudflared.exe no encontrado" -ForegroundColor Red
    Write-Host "  Descarga desde: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Paso 4: Iniciar túnel en modo local
Write-Host "[4] Iniciando túnel en modo local..." -ForegroundColor Yellow
Write-Host "  El túnel usará el config.yml local en lugar del Dashboard" -ForegroundColor Cyan
Write-Host "  Tunnel ID: cf17188d-566f-442f-894a-2a8822c49dfe" -ForegroundColor Gray

$configDir = Split-Path $configPath -Parent
Push-Location $configDir

try {
    $process = Start-Process -FilePath $cloudflaredPath -ArgumentList "tunnel", "run", "cf17188d-566f-442f-894a-2a8822c49dfe" -PassThru -WindowStyle Hidden -ErrorAction Stop
    
    Start-Sleep -Seconds 5
    
    $verifyProcess = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
    if ($verifyProcess) {
        Write-Host "  [OK] Túnel iniciado en modo local (PID: $($process.Id))" -ForegroundColor Green
        Write-Host "  El túnel ahora usa el config.yml con nala-api.patasypelos.xyz" -ForegroundColor Cyan
    } else {
        Write-Host "  [ERROR] El proceso no se inició correctamente" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
} catch {
    Write-Host "  [ERROR] Error al iniciar el túnel: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TUNEL CONFIGURADO EN MODO LOCAL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "El túnel ahora usa el config.yml local que incluye:" -ForegroundColor Cyan
Write-Host "  - patasypelos.xyz -> http://localhost:80" -ForegroundColor Gray
Write-Host "  - api.patasypelos.xyz -> http://localhost:80" -ForegroundColor Gray
Write-Host "  - nala-api.patasypelos.xyz -> http://127.0.0.1:3000" -ForegroundColor Green
Write-Host "  - api-nala.patasypelos.xyz -> http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "Espera 30-60 segundos y prueba:" -ForegroundColor Yellow
Write-Host "  https://nala-api.patasypelos.xyz" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener el túnel:" -ForegroundColor Yellow
Write-Host "  Stop-Process -Name cloudflared -Force" -ForegroundColor Gray
Write-Host ""
