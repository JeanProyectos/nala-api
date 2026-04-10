# Script para iniciar el tunel de Cloudflare
# Ejecutar este script despues de actualizar la configuracion

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIAR CLOUDFLARE TUNNEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$userProfile = $env:USERPROFILE
$configPath = Join-Path $userProfile ".cloudflared\config.yml"

# Verificar si el tunel ya esta corriendo
$tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($tunnelProcess) {
    Write-Host "[INFO] Cloudflare Tunnel ya esta corriendo (PID: $($tunnelProcess.Id))" -ForegroundColor Green
    Write-Host "  Si necesitas reiniciarlo, deten el proceso primero:" -ForegroundColor Yellow
    Write-Host "    Stop-Process -Name cloudflared -Force" -ForegroundColor Gray
    exit 0
}

# Verificar configuracion
if (-not (Test-Path $configPath)) {
    Write-Host "[ERROR] Archivo de configuracion no encontrado: $configPath" -ForegroundColor Red
    exit 1
}

Write-Host "[1] Leyendo configuracion..." -ForegroundColor Yellow
$config = Get-Content $configPath -Raw
$tunnelIdMatch = $config | Select-String -Pattern "tunnel:\s*([a-f0-9-]+)"
if ($tunnelIdMatch) {
    $tunnelId = $tunnelIdMatch.Matches.Groups[1].Value
    Write-Host "  Tunnel ID: $tunnelId" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] No se pudo encontrar el Tunnel ID en la configuracion" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2] Buscando cloudflared.exe..." -ForegroundColor Yellow

$possiblePaths = @(
    "cloudflared.exe",
    "$env:ProgramFiles\cloudflared\cloudflared.exe",
    "$env:ProgramFiles(x86)\cloudflared\cloudflared.exe",
    "$env:LOCALAPPDATA\cloudflared\cloudflared.exe",
    "$userProfile\cloudflared\cloudflared.exe",
    "$userProfile\AppData\Local\cloudflared\cloudflared.exe"
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
    Write-Host ""
    Write-Host "  INSTRUCCIONES:" -ForegroundColor Yellow
    Write-Host "  1. Descarga cloudflared desde: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor White
    Write-Host "  2. O ejecuta manualmente desde el directorio de configuracion:" -ForegroundColor White
    Write-Host "     cd `"$userProfile\.cloudflared`"" -ForegroundColor Gray
    Write-Host "     cloudflared tunnel run $tunnelId" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "[3] Iniciando Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "  Comando: $cloudflaredPath tunnel run $tunnelId" -ForegroundColor Gray

try {
    $configDir = Split-Path $configPath -Parent
    Push-Location $configDir
    
    $process = Start-Process -FilePath $cloudflaredPath -ArgumentList "tunnel", "run", $tunnelId -PassThru -WindowStyle Hidden -ErrorAction Stop
    
    Start-Sleep -Seconds 5
    
    $verifyProcess = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
    if ($verifyProcess) {
        Write-Host "  [OK] Tunnel iniciado (PID: $($process.Id))" -ForegroundColor Green
        Write-Host ""
        Write-Host "  El tunnel esta corriendo en segundo plano" -ForegroundColor Cyan
    } else {
        Write-Host "  [ERROR] El proceso no se inicio correctamente" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
} catch {
    Write-Host "  [ERROR] Error al iniciar el tunnel: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TUNNEL INICIADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener el tunnel, ejecuta:" -ForegroundColor Yellow
Write-Host "  Stop-Process -Name cloudflared -Force" -ForegroundColor Gray
Write-Host ""
Write-Host "Probar la API:" -ForegroundColor Yellow
Write-Host "  https://nala-api.patasypelos.xyz/auth/register" -ForegroundColor Gray
Write-Host ""
