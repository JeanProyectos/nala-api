# Script para configurar inicio automático de Node.js al reiniciar el PC
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR INICIO AUTOMATICO NODE.JS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$productionPath = "C:\inetpub\wwwroot\nala-api"
$nodePath = "C:\Program Files\nodejs\node.exe"
$mainFile = Join-Path $productionPath "dist\src\main.js"

# Verificar que los archivos existan
if (-not (Test-Path $mainFile)) {
    Write-Host "[ERROR] Archivo main.js no encontrado: $mainFile" -ForegroundColor Red
    Write-Host "  Asegurate de haber compilado y publicado la aplicacion" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $nodePath)) {
    Write-Host "[ERROR] Node.js no encontrado en: $nodePath" -ForegroundColor Red
    exit 1
}

Write-Host "OPCION 1: Tarea Programada (Recomendado - No requiere software adicional)" -ForegroundColor Green
Write-Host "OPCION 2: Servicio de Windows con NSSM (Mas robusto, requiere descargar NSSM)" -ForegroundColor Green
Write-Host ""
$opcion = Read-Host "Selecciona opcion (1 o 2)"

if ($opcion -eq "1") {
    Write-Host ""
    Write-Host "Configurando Tarea Programada..." -ForegroundColor Yellow
    
    # Crear script de inicio simplificado
    $startScriptContent = @"
# Script de inicio automatico para Node.js
`$productionPath = "$productionPath"
`$nodePath = "$nodePath"

# Cambiar al directorio de produccion
Set-Location `$productionPath

# Iniciar Node.js
Start-Process -FilePath `$nodePath -ArgumentList "dist\src\main.js" -WindowStyle Hidden -WorkingDirectory `$productionPath
"@
    
    $startScriptPath = Join-Path $productionPath "start-node.ps1"
    $startScriptContent | Out-File -FilePath $startScriptPath -Encoding UTF8
    
    Write-Host "  [OK] Script de inicio creado" -ForegroundColor Green
    
    # Crear tarea programada
    $taskName = "NalaAPI-NodeJS-Startup"
    
    # Eliminar tarea existente si existe
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "  [INFO] Tarea existente eliminada" -ForegroundColor Yellow
    }
    
    # Crear accion
    $actionArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$startScriptPath`""
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $actionArgs
    
    # Crear trigger (al iniciar Windows)
    $trigger = New-ScheduledTaskTrigger -AtStartup
    
    # Configurar para ejecutar como usuario actual
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest
    
    # Configuracion adicional
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    # Registrar tarea
    try {
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Inicia Node.js para Nala API al iniciar Windows" | Out-Null
        Write-Host "  [OK] Tarea programada creada: $taskName" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  CONFIGURACION COMPLETADA" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "La tarea se ejecutara automaticamente al reiniciar el PC" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Para probar la tarea ahora:" -ForegroundColor Cyan
        Write-Host "  Start-ScheduledTask -TaskName `"$taskName`"" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Para ver el estado de la tarea:" -ForegroundColor Cyan
        Write-Host "  Get-ScheduledTask -TaskName `"$taskName`"" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Para eliminar la tarea:" -ForegroundColor Cyan
        Write-Host "  Unregister-ScheduledTask -TaskName `"$taskName`" -Confirm:`$false" -ForegroundColor Gray
    }
    catch {
        Write-Host "  [ERROR] Error al crear la tarea: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Asegurate de ejecutar PowerShell como Administrador" -ForegroundColor Yellow
        exit 1
    }
}
elseif ($opcion -eq "2") {
    Write-Host ""
    Write-Host "Configurando Servicio de Windows con NSSM..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "NSSM (Non-Sucking Service Manager) permite crear servicios de Windows facilmente" -ForegroundColor Cyan
    Write-Host ""
    
    $nssmPath = "C:\Program Files\nssm\nssm.exe"
    $serviceName = "NalaAPI-NodeJS"
    
    # Verificar si NSSM esta instalado
    if (-not (Test-Path $nssmPath)) {
        Write-Host "[INFO] NSSM no esta instalado" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Pasos para instalar NSSM:" -ForegroundColor Cyan
        Write-Host "  1. Descarga NSSM desde: https://nssm.cc/download" -ForegroundColor Gray
        Write-Host "  2. Extrae el archivo ZIP" -ForegroundColor Gray
        Write-Host "  3. Copia nssm.exe a C:\Program Files\nssm\" -ForegroundColor Gray
        Write-Host "  4. Vuelve a ejecutar este script" -ForegroundColor Gray
        Write-Host ""
        
        $download = Read-Host "Quieres abrir la pagina de descarga ahora? (S/N)"
        if ($download -eq "S" -or $download -eq "s") {
            Start-Process "https://nssm.cc/download"
        }
        exit 0
    }
    
    # Verificar si el servicio ya existe
    $existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "[INFO] El servicio ya existe. Eliminando..." -ForegroundColor Yellow
        Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
        & $nssmPath remove $serviceName confirm
        Start-Sleep -Seconds 2
    }
    
    # Crear servicio
    Write-Host "Creando servicio..." -ForegroundColor Yellow
    & $nssmPath install $serviceName $nodePath "dist\src\main.js"
    
    # Configurar directorio de trabajo
    & $nssmPath set $serviceName AppDirectory $productionPath
    
    # Configurar para iniciar automaticamente
    & $nssmPath set $serviceName Start SERVICE_AUTO_START
    
    # Configurar descripcion
    & $nssmPath set $serviceName Description "Servicio Node.js para Nala API"
    
    # Configurar para reiniciar automaticamente si falla
    & $nssmPath set $serviceName AppRestartDelay 5000
    & $nssmPath set $serviceName AppExit Default Restart
    
    Write-Host "  [OK] Servicio creado: $serviceName" -ForegroundColor Green
    
    # Iniciar servicio
    $startService = Read-Host "Quieres iniciar el servicio ahora? (S/N)"
    if ($startService -eq "S" -or $startService -eq "s") {
        Start-Service -Name $serviceName
        Write-Host "  [OK] Servicio iniciado" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  CONFIGURACION COMPLETADA" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "El servicio se iniciara automaticamente al reiniciar el PC" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Comandos utiles:" -ForegroundColor Cyan
    Write-Host "  Iniciar:   Start-Service -Name `"$serviceName`"" -ForegroundColor Gray
    Write-Host "  Detener:   Stop-Service -Name `"$serviceName`"" -ForegroundColor Gray
    Write-Host "  Estado:    Get-Service -Name `"$serviceName`"" -ForegroundColor Gray
    Write-Host "  Eliminar:  & `"$nssmPath`" remove `"$serviceName`" confirm" -ForegroundColor Gray
}
else {
    Write-Host "[ERROR] Opcion no valida" -ForegroundColor Red
    exit 1
}

Write-Host ""
