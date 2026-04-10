# Script para iniciar Node.js como proceso para IIS
# Este script inicia Node.js en el puerto 3000 y lo mantiene corriendo

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIAR NODE.JS PARA IIS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Proyectos Jean Git\nala-api"
$nodePath = "C:\Program Files\nodejs\node.exe"
$mainFile = Join-Path $projectPath "dist\src\main.js"

# Verificar que Node.js esté instalado
if (-not (Test-Path $nodePath)) {
    Write-Host "[ERROR] Node.js no encontrado en: $nodePath" -ForegroundColor Red
    Write-Host "  Verifica que Node.js esté instalado" -ForegroundColor Yellow
    exit 1
}

# Verificar que el archivo main.js exista
if (-not (Test-Path $mainFile)) {
    Write-Host "[ERROR] Archivo main.js no encontrado: $mainFile" -ForegroundColor Red
    Write-Host "  Ejecuta primero: npm run build" -ForegroundColor Yellow
    exit 1
}

# Verificar si ya hay un proceso Node.js corriendo en el puerto 3000
$existingProcess = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*node.exe*"
}

if ($existingProcess) {
    Write-Host "[INFO] Proceso Node.js ya está corriendo (PID: $($existingProcess.Id))" -ForegroundColor Yellow
    $restart = Read-Host "  Deseas reiniciarlo? (S/N)"
    if ($restart -eq "S" -or $restart -eq "s") {
        Stop-Process -Name node -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    } else {
        Write-Host "  Usando proceso existente" -ForegroundColor Green
        exit 0
    }
}

Write-Host "[1] Iniciando Node.js..." -ForegroundColor Yellow
Write-Host "  Archivo: $mainFile" -ForegroundColor Cyan
Write-Host "  Puerto: 3000" -ForegroundColor Cyan

# Cambiar al directorio del proyecto
Push-Location $projectPath

try {
    # Iniciar Node.js en segundo plano
    $process = Start-Process -FilePath $nodePath -ArgumentList $mainFile -PassThru -WindowStyle Hidden -WorkingDirectory $projectPath
    
    Start-Sleep -Seconds 3
    
    # Verificar que el proceso esté corriendo
    $verifyProcess = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
    if ($verifyProcess) {
        Write-Host "  [OK] Node.js iniciado (PID: $($process.Id))" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] El proceso no se inició correctamente" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Verificar que el puerto esté respondiendo
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
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
Write-Host "  NODE.JS INICIADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener Node.js, ejecuta:" -ForegroundColor Yellow
Write-Host "  Stop-Process -Name node -Force" -ForegroundColor Gray
Write-Host ""
Write-Host "Probar la API:" -ForegroundColor Yellow
Write-Host "  Local: http://localhost:3000/auth/register" -ForegroundColor Gray
Write-Host "  Publica: https://nala-api.patasypelos.xyz/auth/register" -ForegroundColor Gray
Write-Host ""
