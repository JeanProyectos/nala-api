# Script de Build para IIS - NALA API
# Ejecutar este script antes de publicar en IIS

Write-Host "🔨 Iniciando build para producción IIS..." -ForegroundColor Cyan

# Verificar que estamos en la carpeta correcta
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Verificar que existe .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Advertencia: No se encontró archivo .env. Asegúrate de crearlo antes de publicar." -ForegroundColor Yellow
}

# Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}

# Generar Prisma Client
Write-Host "🗄️  Generando Prisma Client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al generar Prisma Client" -ForegroundColor Red
    exit 1
}

# Compilar el proyecto
Write-Host "🔨 Compilando proyecto..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al compilar el proyecto" -ForegroundColor Red
    exit 1
}

# Verificar que dist/main.js existe
if (-not (Test-Path "dist/main.js")) {
    Write-Host "❌ Error: No se encontró dist/main.js después del build" -ForegroundColor Red
    exit 1
}

# Verificar que web.config existe
if (-not (Test-Path "web.config")) {
    Write-Host "⚠️  Advertencia: No se encontró web.config. Asegúrate de que esté presente para IIS." -ForegroundColor Yellow
}

Write-Host "✅ Build completado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Verifica que el archivo .env esté configurado correctamente" -ForegroundColor White
Write-Host "   2. Configura el sitio en IIS Manager siguiendo PUBLICACION_IIS.md" -ForegroundColor White
Write-Host "   3. Asegúrate de que los permisos de la carpeta estén configurados" -ForegroundColor White
Write-Host "   4. Inicia el sitio en IIS Manager" -ForegroundColor White
