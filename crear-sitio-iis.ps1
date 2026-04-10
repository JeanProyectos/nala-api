# Script para crear el sitio IIS y Application Pool para NALA API
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CREAR SITIO IIS - NALA API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecute como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "  Click derecho en PowerShell -> Ejecutar como administrador" -ForegroundColor Yellow
    exit 1
}

# Importar modulo de IIS
Import-Module WebAdministration -ErrorAction Stop

$siteName = "nala-api"
$appPoolName = "nala-api-pool"
$physicalPath = "C:\inetpub\wwwroot\nala-api"
$port = 3000

Write-Host "[1] Verificando Application Pool..." -ForegroundColor Yellow

# Verificar si el Application Pool ya existe
$appPool = Get-IISAppPool -Name $appPoolName -ErrorAction SilentlyContinue
if ($appPool) {
    Write-Host "  Application Pool '$appPoolName' ya existe" -ForegroundColor Yellow
    $recreatePool = Read-Host "  Deseas recrearlo? (S/N)"
    if ($recreatePool -eq "S" -or $recreatePool -eq "s") {
        Remove-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
        Write-Host "  Application Pool eliminado" -ForegroundColor Green
    } else {
        Write-Host "  Usando Application Pool existente" -ForegroundColor Green
    }
}

# Crear Application Pool si no existe
if (-not (Get-IISAppPool -Name $appPoolName -ErrorAction SilentlyContinue)) {
    Write-Host "  Creando Application Pool: $appPoolName" -ForegroundColor Yellow
    New-WebAppPool -Name $appPoolName
    
    # Configurar Application Pool
    Set-ItemProperty -Path "IIS:\AppPools\$appPoolName" -Name managedRuntimeVersion -Value ""
    Set-ItemProperty -Path "IIS:\AppPools\$appPoolName" -Name managedPipelineMode -Value "Integrated"
    Set-ItemProperty -Path "IIS:\AppPools\$appPoolName" -Name startMode -Value "AlwaysRunning"
    Set-ItemProperty -Path "IIS:\AppPools\$appPoolName" -Name processModel.idleTimeout -Value ([TimeSpan]::FromMinutes(0))
    
    Write-Host "  Application Pool creado y configurado" -ForegroundColor Green
} else {
    Write-Host "  Application Pool ya existe" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2] Verificando sitio web..." -ForegroundColor Yellow

# Verificar si el sitio ya existe
$site = Get-Website -Name $siteName -ErrorAction SilentlyContinue
if ($site) {
    Write-Host "  Sitio '$siteName' ya existe" -ForegroundColor Yellow
    Write-Host "    Physical Path: $($site.physicalPath)" -ForegroundColor Cyan
    Write-Host "    Estado: $($site.State)" -ForegroundColor Cyan
    
    $recreateSite = Read-Host "  Deseas recrearlo? (S/N)"
    if ($recreateSite -eq "S" -or $recreateSite -eq "s") {
        Remove-Website -Name $siteName -ErrorAction SilentlyContinue
        Write-Host "  Sitio eliminado" -ForegroundColor Green
    } else {
        Write-Host "  Actualizando configuracion del sitio existente..." -ForegroundColor Yellow
        
        # Actualizar Application Pool
        Set-ItemProperty -Path "IIS:\Sites\$siteName" -Name applicationPool -Value $appPoolName
        
        # Actualizar Physical Path
        Set-ItemProperty -Path "IIS:\Sites\$siteName" -Name physicalPath -Value $physicalPath
        
        Write-Host "  Sitio actualizado" -ForegroundColor Green
        $siteCreated = $false
    }
} else {
    $siteCreated = $true
}

# Crear sitio si no existe
if ($siteCreated) {
    Write-Host "  Creando sitio web: $siteName" -ForegroundColor Yellow
    
    # Verificar que el puerto no esté en uso
    $portPattern = "*:" + $port + ":*"
    $portInUse = Get-WebBinding | Where-Object { $_.bindingInformation -like $portPattern }
    if ($portInUse) {
        Write-Host "  [ADVERTENCIA] El puerto $port ya está en uso por otro sitio" -ForegroundColor Yellow
        Write-Host "    Sitio que usa el puerto: $($portInUse.Name)" -ForegroundColor Gray
        $continue = Read-Host "  Deseas continuar de todos modos? (S/N)"
        if ($continue -ne "S" -and $continue -ne "s") {
            exit 1
        }
    }
    
    New-Website -Name $siteName `
                -PhysicalPath $physicalPath `
                -ApplicationPool $appPoolName `
                -Port $port
    
    Write-Host "  Sitio creado" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3] Configurando permisos..." -ForegroundColor Yellow

# Configurar permisos para IIS_IUSRS y Application Pool Identity
$acl = Get-Acl $physicalPath

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
$appPoolIdentity = "IIS AppPool\$appPoolName"
$appPoolRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $appPoolIdentity,
    "ReadAndExecute,ListDirectory",
    "ContainerInherit,ObjectInherit",
    "None",
    "Allow"
)
$acl.SetAccessRule($appPoolRule)

# Permisos para carpeta uploads (escritura)
$uploadsPath = Join-Path $physicalPath "uploads"
if (Test-Path $uploadsPath) {
    $uploadsAcl = Get-Acl $uploadsPath
    $uploadsAcl.SetAccessRule($iisUsersRule)
    $uploadsAcl.SetAccessRule($appPoolRule)
    
    # Agregar permisos de escritura para uploads
    $writeRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $appPoolIdentity,
        "Modify",
        "ContainerInherit,ObjectInherit",
        "None",
        "Allow"
    )
    $uploadsAcl.SetAccessRule($writeRule)
    Set-Acl -Path $uploadsPath -AclObject $uploadsAcl
    Write-Host "  Permisos de escritura configurados para carpeta uploads" -ForegroundColor Green
}

Set-Acl -Path $physicalPath -AclObject $acl
Write-Host "  Permisos configurados" -ForegroundColor Green

Write-Host ""
Write-Host "[4] Iniciando sitio..." -ForegroundColor Yellow

Start-Website -Name $siteName
Start-WebAppPool -Name $appPoolName

Start-Sleep -Seconds 2

$site = Get-Website -Name $siteName
$appPool = Get-IISAppPool -Name $appPoolName

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACION COMPLETA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumen:" -ForegroundColor Yellow
Write-Host "  Application Pool: $appPoolName" -ForegroundColor White
Write-Host "    Estado: $($appPool.State)" -ForegroundColor $(if ($appPool.State -eq 'Started') { 'Green' } else { 'Yellow' })
Write-Host ""
Write-Host "  Sitio Web: $siteName" -ForegroundColor White
Write-Host "    Physical Path: $physicalPath" -ForegroundColor Cyan
Write-Host "    Puerto: $port" -ForegroundColor Cyan
Write-Host "    Estado: $($site.State)" -ForegroundColor $(if ($site.State -eq 'Started') { 'Green' } else { 'Yellow' })
Write-Host "    URL: http://localhost:$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Verificar que el proyecto este compilado (ejecutar build-iis.ps1)" -ForegroundColor White
Write-Host "  2. Verificar que el archivo .env este configurado" -ForegroundColor White
Write-Host "  3. Probar localmente: http://localhost:$port/auth/register" -ForegroundColor White
Write-Host "  4. Probar publicamente: https://nala-api.patasypelos.xyz/auth/register" -ForegroundColor White
Write-Host ""
pause
