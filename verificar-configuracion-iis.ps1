# Script para verificar y corregir la configuracion de IIS y Node.js
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICAR CONFIGURACION IIS/NODE.JS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node"}
if ($nodeProcesses) {
    Write-Host "   [OK] Node.js esta corriendo" -ForegroundColor Green
    $nodeProcesses | ForEach-Object {
        Write-Host "   PID: $($_.Id) - Inicio: $($_.StartTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "   [ERROR] Node.js NO esta corriendo" -ForegroundColor Red
    Write-Host "   Iniciando Node.js..." -ForegroundColor Yellow
    
    $productionPath = "C:\inetpub\wwwroot\nala-api"
    $nodePath = "C:\Program Files\nodejs\node.exe"
    $mainFile = Join-Path $productionPath "dist\src\main.js"
    
    if (Test-Path $mainFile) {
        Set-Location $productionPath
        Start-Process -FilePath $nodePath -ArgumentList "dist\src\main.js" -WindowStyle Hidden -WorkingDirectory $productionPath
        Start-Sleep -Seconds 3
        
        $nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node"}
        if ($nodeProcesses) {
            Write-Host "   [OK] Node.js iniciado" -ForegroundColor Green
        } else {
            Write-Host "   [ERROR] No se pudo iniciar Node.js" -ForegroundColor Red
        }
    } else {
        Write-Host "   [ERROR] Archivo main.js no encontrado: $mainFile" -ForegroundColor Red
    }
}

Write-Host ""

# Verificar puerto 3000
Write-Host "2. Verificando puerto 3000..." -ForegroundColor Yellow
$port3000 = netstat -ano | Select-String ":3000.*LISTENING"
if ($port3000) {
    Write-Host "   [INFO] Puerto 3000 en uso:" -ForegroundColor Yellow
    $port3000 | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
    
    # Verificar si es Node.js o IIS
    $pid = ($port3000 -split '\s+')[-1]
    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($process) {
        if ($process.ProcessName -eq "node") {
            Write-Host "   [OK] Puerto 3000 usado por Node.js" -ForegroundColor Green
        } else {
            Write-Host "   [ADVERTENCIA] Puerto 3000 usado por: $($process.ProcessName)" -ForegroundColor Yellow
            Write-Host "   Esto puede causar conflictos. IIS deberia hacer proxy a Node.js" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   [ERROR] Puerto 3000 no esta en uso" -ForegroundColor Red
}

Write-Host ""

# Verificar web.config
Write-Host "3. Verificando web.config..." -ForegroundColor Yellow
$webConfigPath = "C:\inetpub\wwwroot\nala-api\web.config"
if (Test-Path $webConfigPath) {
    $content = Get-Content $webConfigPath -Raw
    if ($content -match "<rewrite>") {
        Write-Host "   [INFO] web.config contiene seccion <rewrite>" -ForegroundColor Yellow
        Write-Host "   Requiere modulo URL Rewrite de IIS" -ForegroundColor Gray
    } else {
        Write-Host "   [INFO] web.config es minimo (sin rewrite)" -ForegroundColor Yellow
        Write-Host "   IIS no hara proxy a Node.js" -ForegroundColor Gray
    }
} else {
    Write-Host "   [ERROR] web.config no encontrado" -ForegroundColor Red
}

Write-Host ""

# Probar conexion a Node.js
Write-Host "4. Probando conexion a Node.js..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [OK] Node.js responde (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Node.js no responde: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Verifica que Node.js este corriendo y escuchando en el puerto 3000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RECOMENDACIONES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si IIS esta escuchando en el puerto 3000:" -ForegroundColor Yellow
Write-Host "  1. Configura IIS para que escuche en otro puerto (ej: 80 o 8080)" -ForegroundColor Gray
Write-Host "  2. Configura IIS para hacer proxy a Node.js en el puerto 3000" -ForegroundColor Gray
Write-Host "  3. O cambia Node.js para que escuche en otro puerto (ej: 3001)" -ForegroundColor Gray
Write-Host ""
Write-Host "Para instalar modulo URL Rewrite:" -ForegroundColor Yellow
Write-Host "  https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Gray
Write-Host ""
