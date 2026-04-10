# 🔧 Solución Error: Archivo Bloqueado (0x80070020)

## ❌ Error
```
El proceso no tiene acceso al archivo porque está siendo utilizado por otro proceso.
(Excepción de HRESULT: 0x80070020)
```

## 🔍 Causas Posibles

1. **IIS está intentando leer un archivo bloqueado**
2. **Application Pool está bloqueando archivos**
3. **Proceso Node.js está bloqueando archivos**
4. **Antivirus o otro proceso está escaneando la carpeta**

## ✅ Soluciones (de más rápida a más drástica)

### Solución 1: Reiniciar IIS (Recomendado)

```powershell
iisreset /restart
```

Luego intenta iniciar el sitio nuevamente en IIS Manager.

### Solución 2: Reiniciar Application Pool

```powershell
Import-Module WebAdministration
Stop-WebAppPool -Name "nala-api-pool"
Start-Sleep -Seconds 3
Start-WebAppPool -Name "nala-api-pool"
```

### Solución 3: Detener y Reiniciar Node.js

```powershell
# Detener Node.js
Get-Process -Name node | Stop-Process -Force

# Esperar 2 segundos
Start-Sleep -Seconds 2

# Reiniciar desde producción
cd "C:\inetpub\wwwroot\nala-api"
.\iniciar-node-produccion.ps1
```

### Solución 4: Verificar y Liberar Archivos

```powershell
# Ver qué procesos están usando archivos en la carpeta
handle.exe "C:\inetpub\wwwroot\nala-api" 2>$null

# O usar Process Explorer para ver qué proceso bloquea
```

### Solución 5: Reiniciar el Servidor (Última opción)

Si nada más funciona:
```powershell
Restart-Computer -Force
```

## 🎯 Solución Rápida Recomendada

**Ejecuta estos comandos en orden:**

```powershell
# 1. Detener Node.js
Get-Process -Name node | Stop-Process -Force

# 2. Reiniciar IIS
iisreset /restart

# 3. Esperar 5 segundos
Start-Sleep -Seconds 5

# 4. Reiniciar Node.js desde producción
cd "C:\inetpub\wwwroot\nala-api"
.\iniciar-node-produccion.ps1

# 5. Iniciar sitio en IIS Manager
```

## 🔍 Verificación

Después de aplicar la solución:

1. **Verificar que Node.js esté corriendo:**
   ```powershell
   Get-Process -Name node
   netstat -ano | findstr ":3000"
   ```

2. **Verificar que el sitio IIS esté iniciado:**
   ```powershell
   Import-Module WebAdministration
   Get-Website -Name "nala-api" | Select-Object Name, State
   ```

3. **Probar la API:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
   ```

## 📝 Notas

- **iisreset** es más rápido que reiniciar todo el PC
- El error suele ocurrir cuando IIS intenta leer archivos mientras están siendo escritos
- A veces el Application Pool queda en un estado inconsistente

## ⚠️ Si el Error Persiste

1. Verifica que no haya antivirus escaneando la carpeta
2. Verifica permisos de la carpeta `C:\inetpub\wwwroot\nala-api`
3. Verifica que no haya otros procesos usando archivos en esa carpeta
4. Como último recurso, reinicia el servidor

---

**En la mayoría de los casos, `iisreset /restart` resuelve el problema sin necesidad de reiniciar todo el PC.**
