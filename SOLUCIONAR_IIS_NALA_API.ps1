# Script para solucionar el problema de IIS con nala-api

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SOLUCIONAR IIS NALA-API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Detener procesos que puedan estar bloqueando
Write-Host "[1] Deteniendo procesos que pueden bloquear archivos..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  Node.js está corriendo (PID: $($nodeProcesses.Id -join ', '))" -ForegroundColor Cyan
    Write-Host "  Manteniendo Node.js corriendo (necesario para la API)" -ForegroundColor Green
} else {
    Write-Host "  [ADVERTENCIA] Node.js NO está corriendo" -ForegroundColor Yellow
    Write-Host "  Iniciando Node.js..." -ForegroundColor Gray
    $productionPath = "C:\inetpub\wwwroot\nala-api"
    if (Test-Path "$productionPath\iniciar-node-produccion.ps1") {
        Push-Location $productionPath
        & ".\iniciar-node-produccion.ps1"
        Pop-Location
        Start-Sleep -Seconds 3
    }
}
Write-Host ""

# Paso 2: Reiniciar IIS
Write-Host "[2] Reiniciando IIS..." -ForegroundColor Yellow
try {
    iisreset /restart
    Write-Host "  [OK] IIS reiniciado" -ForegroundColor Green
    Start-Sleep -Seconds 5
} catch {
    Write-Host "  [ERROR] Error al reiniciar IIS: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Paso 3: Verificar y reiniciar Application Pool
Write-Host "[3] Verificando Application Pool..." -ForegroundColor Yellow
Import-Module WebAdministration -ErrorAction SilentlyContinue

$appPoolName = "nala-api-pool"
$appPoolExists = Get-WebAppPoolState -Name $appPoolName -ErrorAction SilentlyContinue

if ($appPoolExists) {
    Write-Host "  Application Pool encontrado: $appPoolName" -ForegroundColor Green
    $state = (Get-WebAppPoolState -Name $appPoolName).Value
    Write-Host "  Estado actual: $state" -ForegroundColor Cyan
    
    if ($state -ne "Started") {
        Write-Host "  Iniciando Application Pool..." -ForegroundColor Gray
        Start-WebAppPool -Name $appPoolName
        Start-Sleep -Seconds 2
        Write-Host "  [OK] Application Pool iniciado" -ForegroundColor Green
    } else {
        Write-Host "  Reiniciando Application Pool..." -ForegroundColor Gray
        Restart-WebAppPool -Name $appPoolName
        Start-Sleep -Seconds 2
        Write-Host "  [OK] Application Pool reiniciado" -ForegroundColor Green
    }
} else {
    Write-Host "  [ADVERTENCIA] Application Pool '$appPoolName' no encontrado" -ForegroundColor Yellow
    Write-Host "  Intentando con nombre alternativo..." -ForegroundColor Gray
    
    # Buscar otros application pools relacionados
    $allPools = Get-WebAppPoolState | Where-Object { $_.Name -like "*nala*" -or $_.Name -like "*api*" }
    if ($allPools) {
        Write-Host "  Application Pools encontrados:" -ForegroundColor Cyan
        $allPools | ForEach-Object { Write-Host "    - $($_.Name): $($_.Value)" -ForegroundColor Gray }
    }
}
Write-Host ""

# Paso 4: Verificar y iniciar el sitio
Write-Host "[4] Verificando sitio nala-api..." -ForegroundColor Yellow
$site = Get-Website -Name "nala-api" -ErrorAction SilentlyContinue

if ($site) {
    Write-Host "  Sitio encontrado: nala-api" -ForegroundColor Green
    Write-Host "  Estado actual: $($site.State)" -ForegroundColor Cyan
    Write-Host "  Ruta física: $($site.PhysicalPath)" -ForegroundColor Gray
    
    if ($site.State -ne "Started") {
        Write-Host "  Iniciando sitio..." -ForegroundColor Gray
        Start-Website -Name "nala-api"
        Start-Sleep -Seconds 2
        
        $siteAfter = Get-Website -Name "nala-api"
        if ($siteAfter.State -eq "Started") {
            Write-Host "  [OK] Sitio iniciado correctamente" -ForegroundColor Green
        } else {
            Write-Host "  [ERROR] No se pudo iniciar el sitio" -ForegroundColor Red
            Write-Host "  Estado: $($siteAfter.State)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [OK] Sitio ya está iniciado" -ForegroundColor Green
    }
} else {
    Write-Host "  [ERROR] Sitio 'nala-api' no encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Sitios disponibles:" -ForegroundColor Yellow
    Get-Website | Select-Object Name, State | Format-Table -AutoSize
    Write-Host ""
    Write-Host "  Si el sitio no existe, créalo primero con:" -ForegroundColor Yellow
    Write-Host "    .\crear-sitio-iis.ps1" -ForegroundColor Gray
}
Write-Host ""

# Paso 5: Verificar puerto 3000
Write-Host "[5] Verificando puerto 3000..." -ForegroundColor Yellow
$port3000 = netstat -ano | findstr ":3000" | findstr "LISTENING"
if ($port3000) {
    Write-Host "  [OK] Puerto 3000 está en uso (Node.js corriendo)" -ForegroundColor Green
    Write-Host "  $port3000" -ForegroundColor Gray
} else {
    Write-Host "  [ADVERTENCIA] Puerto 3000 NO está en uso" -ForegroundColor Yellow
    Write-Host "  Node.js no está corriendo. Iniciando..." -ForegroundColor Gray
    $productionPath = "C:\inetpub\wwwroot\nala-api"
    if (Test-Path "$productionPath\iniciar-node-produccion.ps1") {
        Push-Location $productionPath
        & ".\iniciar-node-produccion.ps1"
        Pop-Location
    }
}
Write-Host ""

# Paso 6: Verificar estado final
Write-Host "[6] Estado final:" -ForegroundColor Yellow
Write-Host ""

$nodeRunning = Get-Process -Name node -ErrorAction SilentlyContinue
$tunnelRunning = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
$siteState = (Get-Website -Name "nala-api" -ErrorAction SilentlyContinue).State

Write-Host "  Node.js:" -ForegroundColor Cyan
if ($nodeRunning) {
    Write-Host "    ✅ Corriendo (PID: $($nodeRunning.Id -join ', '))" -ForegroundColor Green
} else {
    Write-Host "    ❌ No está corriendo" -ForegroundColor Red
}

Write-Host "  Cloudflare Tunnel:" -ForegroundColor Cyan
if ($tunnelRunning) {
    Write-Host "    ✅ Corriendo (PID: $($tunnelRunning.Id -join ', '))" -ForegroundColor Green
} else {
    Write-Host "    ❌ No está corriendo" -ForegroundColor Red
}

Write-Host "  Sitio IIS nala-api:" -ForegroundColor Cyan
if ($siteState -eq "Started") {
    Write-Host "    ✅ Iniciado" -ForegroundColor Green
} else {
    Write-Host "    ❌ Estado: $siteState" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora intenta iniciar el sitio desde IIS Manager:" -ForegroundColor Yellow
Write-Host "  1. Abre IIS Manager" -ForegroundColor Gray
Write-Host "  2. Ve a Sitios -> nala-api" -ForegroundColor Gray
Write-Host "  3. Click derecho -> Iniciar" -ForegroundColor Gray
Write-Host ""
Write-Host "O prueba directamente:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor Gray
Write-Host "  https://nala-api.patasypelos.xyz" -ForegroundColor Gray
Write-Host ""
