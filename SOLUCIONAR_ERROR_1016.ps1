# Script para solucionar Error 1016 Cloudflare + IIS Archivo Bloqueado
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SOLUCIONAR ERROR 1016 + IIS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Detener procesos
Write-Host "[1] Deteniendo procesos..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  Deteniendo Node.js..." -ForegroundColor Gray
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

$tunnelProcesses = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
if ($tunnelProcesses) {
    Write-Host "  Deteniendo Cloudflare Tunnel..." -ForegroundColor Gray
    $tunnelProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Host "  [OK] Procesos detenidos" -ForegroundColor Green
Write-Host ""

# Paso 2: Reiniciar IIS
Write-Host "[2] Reiniciando IIS..." -ForegroundColor Yellow
try {
    iisreset /restart
    Write-Host "  [OK] IIS reiniciado" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Error al reiniciar IIS: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Ejecuta manualmente: iisreset /restart" -ForegroundColor Yellow
}
Write-Host ""

# Paso 3: Esperar
Write-Host "[3] Esperando 5 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""

# Paso 4: Verificar puerto 3000
Write-Host "[4] Verificando puerto 3000..." -ForegroundColor Yellow
$port3000 = netstat -ano | findstr ":3000" | findstr "LISTENING"
if ($port3000) {
    Write-Host "  [INFO] Puerto 3000 ya está en uso" -ForegroundColor Yellow
    Write-Host "  Verificando si Node.js responde..." -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "  [OK] Node.js está respondiendo (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "  [ADVERTENCIA] Puerto 3000 en uso pero no responde" -ForegroundColor Yellow
        Write-Host "  Iniciando Node.js..." -ForegroundColor Gray
        $startNode = $true
    }
} else {
    Write-Host "  [INFO] Puerto 3000 libre, iniciando Node.js..." -ForegroundColor Yellow
    $startNode = $true
}

# Paso 5: Iniciar Node.js si es necesario
if ($startNode) {
    Write-Host ""
    Write-Host "[5] Iniciando Node.js..." -ForegroundColor Yellow
    $productionPath = "C:\inetpub\wwwroot\nala-api"
    $startScript = Join-Path $productionPath "iniciar-node-produccion.ps1"
    
    if (Test-Path $startScript) {
        try {
            Push-Location $productionPath
            & $startScript
            Pop-Location
            Write-Host "  [OK] Node.js iniciado" -ForegroundColor Green
            Start-Sleep -Seconds 3
        } catch {
            Write-Host "  [ERROR] Error al iniciar Node.js: $($_.Exception.Message)" -ForegroundColor Red
            Pop-Location
        }
    } else {
        Write-Host "  [ERROR] Script no encontrado: $startScript" -ForegroundColor Red
        Write-Host "  Inicia Node.js manualmente desde: $productionPath" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "[5] Node.js ya está corriendo, omitiendo inicio" -ForegroundColor Green
}
Write-Host ""

# Paso 6: Verificar túnel
Write-Host "[6] Verificando Cloudflare Tunnel..." -ForegroundColor Yellow
$tunnelRunning = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
if ($tunnelRunning) {
    Write-Host "  [OK] Tunnel ya está corriendo (PID: $($tunnelRunning.Id))" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Tunnel no está corriendo, iniciando..." -ForegroundColor Yellow
    $tunnelScript = "C:\Proyectos Jean Git\nala-api\INICIAR_TUNEL.ps1"
    
    if (Test-Path $tunnelScript) {
        try {
            & $tunnelScript
            Write-Host "  [OK] Tunnel iniciado" -ForegroundColor Green
            Start-Sleep -Seconds 5
        } catch {
            Write-Host "  [ERROR] Error al iniciar tunnel: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  [ERROR] Script no encontrado: $tunnelScript" -ForegroundColor Red
        Write-Host "  Inicia el tunnel manualmente" -ForegroundColor Yellow
    }
}
Write-Host ""

# Paso 7: Verificar estado final
Write-Host "[7] Verificando estado final..." -ForegroundColor Yellow
Write-Host ""

$nodeRunning = Get-Process -Name node -ErrorAction SilentlyContinue
$tunnelRunning = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
$port3000 = netstat -ano | findstr ":3000" | findstr "LISTENING"

Write-Host "  Estado de Node.js:" -ForegroundColor Cyan
if ($nodeRunning) {
    Write-Host "    ✅ Corriendo (PID: $($nodeRunning.Id))" -ForegroundColor Green
} else {
    Write-Host "    ❌ No está corriendo" -ForegroundColor Red
}

Write-Host "  Estado del puerto 3000:" -ForegroundColor Cyan
if ($port3000) {
    Write-Host "    ✅ En uso" -ForegroundColor Green
} else {
    Write-Host "    ❌ Libre" -ForegroundColor Red
}

Write-Host "  Estado del Tunnel:" -ForegroundColor Cyan
if ($tunnelRunning) {
    Write-Host "    ✅ Corriendo (PID: $($tunnelRunning.Id))" -ForegroundColor Green
} else {
    Write-Host "    ❌ No está corriendo" -ForegroundColor Red
}

Write-Host ""

# Paso 8: Probar localmente
Write-Host "[8] Probando API localmente..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "  [OK] API local responde (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] API local no responde: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Verifica que Node.js esté corriendo correctamente" -ForegroundColor Yellow
}
Write-Host ""

# Paso 9: Instrucciones finales
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICACION REQUERIDA" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE: El Error 1016 requiere verificacion manual:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ve a Cloudflare Dashboard:" -ForegroundColor White
Write-Host "   https://dash.cloudflare.com/" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Ve a: Networks -> Connectors -> Tunnels -> mundialpet-tunnel" -ForegroundColor White
Write-Host ""
Write-Host "3. Ve a la pestana 'Public Hostnames' o 'Routes'" -ForegroundColor White
Write-Host ""
Write-Host "4. Verifica que 'nala-api.patasypelos.xyz' este en la lista" -ForegroundColor White
Write-Host ""
Write-Host "5. Si NO esta, agregalo:" -ForegroundColor Yellow
Write-Host "   - Subdomain: nala-api" -ForegroundColor Gray
Write-Host "   - Domain: patasypelos.xyz" -ForegroundColor Gray
Write-Host "   - Service: http://127.0.0.1:3000" -ForegroundColor Gray
Write-Host "   - HTTP Host Header: nala-api.patasypelos.xyz (opcional)" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Espera 1-2 minutos y prueba:" -ForegroundColor White
Write-Host "   https://nala-api.patasypelos.xyz" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
