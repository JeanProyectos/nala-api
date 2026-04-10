# Script para publicar NALA API en C:\inetpub\wwwroot\nala-api
# Separa la publicacion del codigo de desarrollo
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PUBLICAR NALA API EN WWWROOT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecute como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "  Click derecho en PowerShell -> Ejecutar como administrador" -ForegroundColor Yellow
    exit 1
}

$sourcePath = "C:\Proyectos Jean Git\nala-api"
$targetPath = "C:\inetpub\wwwroot\nala-api"

Write-Host "[1] Verificando codigo fuente..." -ForegroundColor Yellow

if (-not (Test-Path $sourcePath)) {
    Write-Host "  [ERROR] No se encontro el codigo fuente en: $sourcePath" -ForegroundColor Red
    exit 1
}

Write-Host "  Codigo fuente: $sourcePath" -ForegroundColor Green

# Verificar que el proyecto este compilado
$distPath = Join-Path $sourcePath "dist\src\main.js"
if (-not (Test-Path $distPath)) {
    Write-Host "  [ADVERTENCIA] El proyecto no esta compilado" -ForegroundColor Yellow
    Write-Host "  Compilando proyecto..." -ForegroundColor Yellow
    
    Push-Location $sourcePath
    npm run build:prod
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Error al compilar el proyecto" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "  Proyecto compilado correctamente" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2] Preparando carpeta de publicacion..." -ForegroundColor Yellow

# Crear carpeta de destino si no existe
if (Test-Path $targetPath) {
    Write-Host "  La carpeta de publicacion ya existe: $targetPath" -ForegroundColor Yellow
    $overwrite = Read-Host "  Deseas eliminar y recrear? (S/N)"
    if ($overwrite -eq "S" -or $overwrite -eq "s") {
        Remove-Item -Path $targetPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Carpeta eliminada" -ForegroundColor Green
    }
}

if (-not (Test-Path $targetPath)) {
    New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
    Write-Host "  Carpeta creada: $targetPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3] Copiando archivos de produccion..." -ForegroundColor Yellow

# Archivos y carpetas a copiar
$itemsToCopy = @(
    "dist",           # Codigo compilado
    "node_modules",   # Dependencias
    "prisma",         # Schema y migraciones de Prisma
    "prisma.config.ts", # Configuracion de Prisma
    "uploads",        # Archivos subidos
    "web.config",     # Configuracion IIS
    "package.json",   # Para referencia
    "package-lock.json" # Para referencia
)

foreach ($item in $itemsToCopy) {
    $sourceItem = Join-Path $sourcePath $item
    $targetItem = Join-Path $targetPath $item
    
    if (Test-Path $sourceItem) {
        Write-Host "  Copiando: $item" -ForegroundColor Cyan
        
        if (Test-Path $targetItem) {
            Remove-Item -Path $targetItem -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        Copy-Item -Path $sourceItem -Destination $targetItem -Recurse -Force
        Write-Host "    [OK] $item copiado" -ForegroundColor Green
    } else {
        Write-Host "  [ADVERTENCIA] No se encontro: $item" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[4] Copiando archivo .env..." -ForegroundColor Yellow

$envSource = Join-Path $sourcePath ".env"
$envTarget = Join-Path $targetPath ".env"

if (Test-Path $envSource) {
    Copy-Item -Path $envSource -Destination $envTarget -Force
    Write-Host "  [OK] .env copiado" -ForegroundColor Green
    Write-Host "  [IMPORTANTE] Verifica que el .env tenga la configuracion correcta para produccion" -ForegroundColor Yellow
} else {
    Write-Host "  [ADVERTENCIA] No se encontro archivo .env" -ForegroundColor Yellow
    Write-Host "    Crea un archivo .env en: $targetPath" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[5] Configurando permisos..." -ForegroundColor Yellow

# Configurar permisos para IIS
$acl = Get-Acl $targetPath

# Permisos para IIS_IUSRS
$iisUsersRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "IIS_IUSRS",
    "ReadAndExecute,ListDirectory",
    "ContainerInherit,ObjectInherit",
    "None",
    "Allow"
)
$acl.SetAccessRule($iisUsersRule)

# Permisos para Application Pool Identity
$appPoolIdentity = "IIS AppPool\nala-api-pool"
$appPoolRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $appPoolIdentity,
    "ReadAndExecute,ListDirectory",
    "ContainerInherit,ObjectInherit",
    "None",
    "Allow"
)
$acl.SetAccessRule($appPoolRule)

Set-Acl -Path $targetPath -AclObject $acl

# Permisos especiales para carpeta uploads
$uploadsPath = Join-Path $targetPath "uploads"
if (Test-Path $uploadsPath) {
    $uploadsAcl = Get-Acl $uploadsPath
    $uploadsAcl.SetAccessRule($iisUsersRule)
    $uploadsAcl.SetAccessRule($appPoolRule)
    
    # Permisos de escritura para uploads
    $writeRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $appPoolIdentity,
        "Modify",
        "ContainerInherit,ObjectInherit",
        "None",
        "Allow"
    )
    $uploadsAcl.SetAccessRule($writeRule)
    Set-Acl -Path $uploadsPath -AclObject $uploadsAcl
    Write-Host "  Permisos de escritura configurados para uploads" -ForegroundColor Green
}

Write-Host "  Permisos configurados" -ForegroundColor Green

Write-Host ""
Write-Host "[6] Actualizando configuracion IIS..." -ForegroundColor Yellow

Import-Module WebAdministration -ErrorAction SilentlyContinue

$siteName = "nala-api"
$site = Get-Website -Name $siteName -ErrorAction SilentlyContinue

if ($site) {
    Set-ItemProperty -Path "IIS:\Sites\$siteName" -Name physicalPath -Value $targetPath
    Write-Host "  Physical Path actualizado a: $targetPath" -ForegroundColor Green
} else {
    Write-Host "  [ADVERTENCIA] Sitio '$siteName' no encontrado en IIS" -ForegroundColor Yellow
    Write-Host "    Ejecuta crear-sitio-iis.ps1 para crear el sitio" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PUBLICACION COMPLETA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumen:" -ForegroundColor Yellow
Write-Host "  Codigo fuente: $sourcePath" -ForegroundColor White
Write-Host "  Publicacion: $targetPath" -ForegroundColor White
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Verificar que el archivo .env este configurado correctamente" -ForegroundColor White
Write-Host "  2. Iniciar Node.js en la carpeta de publicacion:" -ForegroundColor White
Write-Host "     cd $targetPath" -ForegroundColor Gray
Write-Host "     node dist\src\main.js" -ForegroundColor Gray
Write-Host "  3. O usar el script: .\iniciar-node-produccion.ps1" -ForegroundColor White
Write-Host "  4. Iniciar el sitio en IIS Manager" -ForegroundColor White
Write-Host "  5. Probar: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Para actualizar la publicacion:" -ForegroundColor Yellow
Write-Host "  1. Compilar cambios: npm run build" -ForegroundColor White
Write-Host "  2. Ejecutar este script nuevamente" -ForegroundColor White
Write-Host ""
pause
