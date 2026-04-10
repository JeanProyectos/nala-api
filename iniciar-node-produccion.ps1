# Script para iniciar Node.js desde la carpeta de publicacion
# Ejecutar desde C:\inetpub\wwwroot\nala-api

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIAR NODE.JS - PRODUCCION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$productionPath = "C:\inetpub\wwwroot\nala-api"
$nodePath = "C:\Program Files\nodejs\node.exe"
$mainFile = Join-Path $productionPath "dist\src\main.js"

# Verificar que estamos en la carpeta correcta o cambiar a ella
if (-not (Test-Path $productionPath)) {
    Write-Host "[ERROR] Carpeta de publicacion no encontrada: $productionPath" -ForegroundColor Red
    Write-Host "  Ejecuta primero: publicar-en-wwwroot.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar que Node.js esté instalado
if (-not (Test-Path $nodePath)) {
    Write-Host "[ERROR] Node.js no encontrado en: $nodePath" -ForegroundColor Red
    exit 1
}

# Verificar que el archivo main.js exista
if (-not (Test-Path $mainFile)) {
    Write-Host "[ERROR] Archivo main.js no encontrado: $mainFile" -ForegroundColor Red
    Write-Host "  Ejecuta primero: publicar-en-wwwroot.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar si ya hay un proceso Node.js corriendo en el puerto 3001
$portInUse = netstat -ano | findstr ":3001" | findstr "LISTENING"
if ($portInUse) {
    Write-Host "[INFO] El puerto 3001 ya esta en uso" -ForegroundColor Yellow
    $restart = Read-Host "  Deseas detener el proceso y reiniciar? (S/N)"
    if ($restart -eq "S" -or $restart -eq "s") {
        Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 2
    } else {
        Write-Host "  Usando proceso existente" -ForegroundColor Green
        exit 0
    }
}

Write-Host "[1] Iniciando Node.js desde produccion..." -ForegroundColor Yellow
Write-Host "  Carpeta: $productionPath" -ForegroundColor Cyan
Write-Host "  Archivo: dist\src\main.js" -ForegroundColor Cyan
Write-Host "  Puerto: 3001" -ForegroundColor Cyan

# Cambiar al directorio de produccion
Push-Location $productionPath

try {
    # Iniciar Node.js en segundo plano
    $process = Start-Process -FilePath $nodePath -ArgumentList "dist\src\main.js" -PassThru -WindowStyle Hidden -WorkingDirectory $productionPath
    
    Start-Sleep -Seconds 3
    
    # Verificar que el proceso esté corriendo
    $verifyProcess = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
    if ($verifyProcess) {
        Write-Host "  [OK] Node.js iniciado (PID: $($process.Id))" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] El proceso no se inicio correctamente" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Verificar que el puerto esté respondiendo
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "  [OK] API respondiendo (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "  [ADVERTENCIA] API no responde aún: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "    Espera unos segundos y verifica nuevamente" -ForegroundColor Gray
    }
    
    Pop-Location
} catch {
    Write-Host "  [ERROR] Error al iniciar Node.js: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NODE.JS INICIADO - PRODUCCION" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener Node.js, ejecuta:" -ForegroundColor Yellow
Write-Host "  Stop-Process -Name node -Force" -ForegroundColor Gray
Write-Host ""
Write-Host "Probar la API:" -ForegroundColor Yellow
Write-Host "  Local: http://localhost:3001/auth/register" -ForegroundColor Gray
Write-Host "  Publica: https://nala-api.patasypelos.xyz/auth/register" -ForegroundColor Gray
Write-Host ""
