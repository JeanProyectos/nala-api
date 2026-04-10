# Script para diagnosticar y solucionar el error 500.19 en IIS
# Ejecutar como Administrador

Write-Host "=== Diagnóstico de Error IIS 500.19 ===" -ForegroundColor Cyan
Write-Host ""

# Verificar si el módulo URL Rewrite está instalado
Write-Host "1. Verificando módulo URL Rewrite..." -ForegroundColor Yellow
$rewriteDll = "C:\Windows\System32\inetsrv\rewrite.dll"
if (Test-Path $rewriteDll) {
    Write-Host "   ✓ Módulo URL Rewrite encontrado" -ForegroundColor Green
} else {
    Write-Host "   ✗ Módulo URL Rewrite NO encontrado" -ForegroundColor Red
    Write-Host "   → Necesitas instalar: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Yellow
}

Write-Host ""

# Verificar si Node.js está corriendo en el puerto 3000
Write-Host "2. Verificando Node.js en puerto 3000..." -ForegroundColor Yellow
$nodeProcess = netstat -ano | Select-String ":3000.*LISTENING"
if ($nodeProcess) {
    Write-Host "   ✓ Node.js está corriendo en puerto 3000" -ForegroundColor Green
    $nodeProcess | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "   ✗ Node.js NO está corriendo en puerto 3000" -ForegroundColor Red
    Write-Host "   → Inicia Node.js primero" -ForegroundColor Yellow
}

Write-Host ""

# Verificar web.config
Write-Host "3. Verificando web.config..." -ForegroundColor Yellow
$webConfigPath = "C:\inetpub\wwwroot\nala-api\web.config"
if (Test-Path $webConfigPath) {
    Write-Host "   ✓ web.config encontrado" -ForegroundColor Green
    
    # Verificar si contiene sección rewrite
    $content = Get-Content $webConfigPath -Raw
    if ($content -match "<rewrite>") {
        Write-Host "   ⚠ web.config contiene sección <rewrite> (requiere URL Rewrite Module)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✗ web.config NO encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Soluciones ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPCIÓN 1: Instalar URL Rewrite Module" -ForegroundColor Green
Write-Host "   1. Descarga: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Gray
Write-Host "   2. Instala el módulo" -ForegroundColor Gray
Write-Host "   3. Ejecuta: iisreset" -ForegroundColor Gray
Write-Host ""
Write-Host "OPCIÓN 2: Usar web.config mínimo (sin proxy)" -ForegroundColor Green
Write-Host "   Ejecuta este comando para crear un web.config mínimo:" -ForegroundColor Gray
Write-Host '   Copy-Item "C:\Proyectos Jean Git\nala-api\web.config.minimal" "C:\inetpub\wwwroot\nala-api\web.config" -Force' -ForegroundColor White
Write-Host ""
Write-Host "OPCIÓN 3: Acceder directamente a Node.js" -ForegroundColor Green
Write-Host "   Si Node.js está corriendo, accede directamente a: http://localhost:3000" -ForegroundColor Gray
Write-Host ""

# Preguntar si quiere crear web.config mínimo
$response = Read-Host "¿Quieres crear un web.config mínimo ahora? (S/N)"
if ($response -eq "S" -or $response -eq "s") {
    $minimalPath = "C:\Proyectos Jean Git\nala-api\web.config.minimal"
    if (Test-Path $minimalPath) {
        try {
            Copy-Item $minimalPath $webConfigPath -Force
            Write-Host "✓ web.config mínimo creado" -ForegroundColor Green
            Write-Host "⚠ Nota: Este web.config NO hará proxy a Node.js" -ForegroundColor Yellow
            Write-Host "  Accede directamente a http://localhost:3000 si Node.js está corriendo" -ForegroundColor Yellow
        } catch {
            Write-Host "✗ Error al crear web.config: $_" -ForegroundColor Red
            Write-Host "  Ejecuta PowerShell como Administrador" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ No se encontró web.config.minimal" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Presiona Enter para salir..."
Read-Host
