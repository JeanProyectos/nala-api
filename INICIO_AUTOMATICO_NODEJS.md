# 🚀 Configurar Inicio Automático de Node.js

## Problema
Cada vez que se reinicia el PC, hay que iniciar Node.js manualmente para que la API funcione.

## Solución
Configurar Node.js para que se inicie automáticamente al reiniciar el PC.

## Opciones Disponibles

### Opción 1: Tarea Programada (Recomendado - Más Simple)
✅ No requiere software adicional  
✅ Fácil de configurar y mantener  
✅ Se ejecuta al iniciar Windows

### Opción 2: Servicio de Windows con NSSM (Más Robusto)
✅ Se ejecuta como servicio de Windows  
✅ Reinicio automático si falla  
✅ Más control y monitoreo  
⚠️ Requiere descargar NSSM (gratis)

---

## 📋 Instrucciones Rápidas

### Paso 1: Ejecutar el Script de Configuración

Abre PowerShell **como Administrador** y ejecuta:

```powershell
cd "C:\Proyectos Jean Git\nala-api"
.\configurar-inicio-automatico.ps1
```

### Paso 2: Seleccionar Opción

El script te preguntará qué opción quieres usar:
- **Opción 1**: Tarea Programada (recomendado)
- **Opción 2**: Servicio de Windows con NSSM

### Paso 3: Verificar

Después de configurar, reinicia el PC y verifica que Node.js se inicie automáticamente:

```powershell
# Verificar que Node.js está corriendo
netstat -ano | findstr :3000

# O probar la API
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
```

---

## 🔧 Comandos Útiles

### Para Tarea Programada (Opción 1)

```powershell
# Ver estado de la tarea
Get-ScheduledTask -TaskName "NalaAPI-NodeJS-Startup"

# Ejecutar la tarea manualmente
Start-ScheduledTask -TaskName "NalaAPI-NodeJS-Startup"

# Ver historial de ejecución
Get-ScheduledTaskInfo -TaskName "NalaAPI-NodeJS-Startup"

# Eliminar la tarea
Unregister-ScheduledTask -TaskName "NalaAPI-NodeJS-Startup" -Confirm:$false
```

### Para Servicio de Windows (Opción 2)

```powershell
# Ver estado del servicio
Get-Service -Name "NalaAPI-NodeJS"

# Iniciar servicio
Start-Service -Name "NalaAPI-NodeJS"

# Detener servicio
Stop-Service -Name "NalaAPI-NodeJS"

# Reiniciar servicio
Restart-Service -Name "NalaAPI-NodeJS"
```

---

## 🐛 Solución de Problemas

### La tarea/servicio no inicia Node.js

1. **Verificar que la aplicación esté compilada:**
   ```powershell
   Test-Path "C:\inetpub\wwwroot\nala-api\dist\src\main.js"
   ```

2. **Verificar que Node.js esté instalado:**
   ```powershell
   Test-Path "C:\Program Files\nodejs\node.exe"
   ```

3. **Verificar permisos:**
   - Asegúrate de ejecutar el script como Administrador
   - Verifica que el usuario tenga permisos en `C:\inetpub\wwwroot\nala-api`

### Node.js se inicia pero la API no responde

1. **Verificar variables de entorno:**
   - Asegúrate de que las variables de entorno necesarias estén configuradas
   - Puede que necesites configurarlas en el servicio/tarea

2. **Verificar la base de datos:**
   - Asegúrate de que la base de datos esté accesible
   - Verifica la cadena de conexión

3. **Ver logs:**
   - Revisa el Visor de eventos de Windows
   - O ejecuta Node.js manualmente para ver errores

---

## 📝 Notas Importantes

- **Variables de entorno**: Si tu aplicación necesita variables de entorno, puede que necesites configurarlas en la tarea/servicio
- **Puerto 3000**: Asegúrate de que el puerto 3000 esté disponible
- **Firewall**: Verifica que el firewall permita conexiones en el puerto 3000
- **Actualizaciones**: Si actualizas la aplicación, puede que necesites reiniciar el servicio/tarea

---

## ✅ Verificación Final

Después de configurar, prueba reiniciando el PC y verifica:

1. ✅ Node.js se inicia automáticamente
2. ✅ La API responde en `http://localhost:3000`
3. ✅ IIS puede hacer proxy correctamente

Si todo funciona, ¡ya no necesitarás iniciar Node.js manualmente después de cada reinicio! 🎉
