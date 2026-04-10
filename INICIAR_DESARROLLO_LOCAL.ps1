# Script para iniciar desarrollo local completo

Write-Host "🚀 Iniciando desarrollo local de NALA..." -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json" -ForegroundColor Red
    Write-Host "   Ejecuta este script desde: C:\Proyectos Jean Git\nala-api" -ForegroundColor Yellow
    exit 1
}

# Verificar si Node.js ya está corriendo
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠️  Ya hay procesos de Node.js corriendo:" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object { Write-Host "   PID: $($_.Id)" -ForegroundColor Gray }
    Write-Host ""
    $response = Read-Host "¿Deseas detenerlos y continuar? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        Stop-Process -Name node -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Procesos detenidos" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "❌ Cancelado" -ForegroundColor Red
        exit 0
    }
}

Write-Host "📦 Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "   Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🔧 Iniciando API en modo desarrollo..." -ForegroundColor Cyan
Write-Host "   URL: http://localhost:3000" -ForegroundColor Gray
Write-Host "   URL Red: http://192.168.20.53:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""

# Iniciar en modo desarrollo
npm run start:dev
