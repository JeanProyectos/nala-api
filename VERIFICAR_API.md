# 🔍 Cómo Verificar que la API está Corriendo

## Método 1: Verificar el Proceso en la Terminal

Cuando inicies el backend con:
```powershell
cd C:\nala-api
npm run start:dev
```

**Deberías ver estos mensajes:**
```
✅ Conectado a la base de datos
🚀 API NALA corriendo en http://localhost:3000
📡 Accesible desde la red local
```

Si ves estos mensajes, **la API está corriendo correctamente**.

---

## Método 2: Verificar el Puerto con PowerShell

Abre una **nueva terminal** (PowerShell) y ejecuta:

```powershell
Test-NetConnection -ComputerName localhost -Port 3000
```

**Si está corriendo, verás:**
```
TcpTestSucceeded : True
```

**Si NO está corriendo, verás:**
```
TcpTestSucceeded : False
```

---

## Método 3: Verificar con netstat

```powershell
netstat -ano | findstr :3000
```

**Si está corriendo, verás algo como:**
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       12345
```

Donde `12345` es el ID del proceso.

---

## Método 4: Hacer una Petición HTTP

### Con PowerShell (Invoke-WebRequest):
```powershell
Invoke-WebRequest -Uri http://localhost:3000 -Method GET
```

**Si está corriendo, verás:**
```
StatusCode        : 200
StatusDescription : OK
Content           : {"message":"Hello World!"}
```

### Con curl (si está disponible):
```powershell
curl http://localhost:3000
```

**Si está corriendo, verás:**
```
{"message":"Hello World!"}
```

---

## Método 5: Abrir en el Navegador

Simplemente abre tu navegador y ve a:
```
http://localhost:3000
```

**Si está corriendo, verás:**
```
Hello World!
```

---

## Método 6: Ver Procesos de Node.js

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue
```

Esto mostrará todos los procesos de Node.js corriendo.

---

## ⚠️ Si la API NO está Corriendo

### Iniciar el Backend:

```powershell
cd C:\nala-api
npm run start:dev
```

### Verificar Errores:

Si hay errores, revisa:
1. **Base de datos conectada:** Deberías ver `✅ Conectado a la base de datos`
2. **Puerto ocupado:** Si el puerto 3000 está ocupado, cambia el `PORT` en `.env`
3. **Dependencias instaladas:** Ejecuta `npm install` si faltan paquetes

---

## ✅ Checklist Rápido

- [ ] Terminal muestra: `🚀 API NALA corriendo en http://localhost:3000`
- [ ] `Test-NetConnection` muestra: `TcpTestSucceeded : True`
- [ ] `netstat` muestra el puerto 3000 en LISTENING
- [ ] Navegador muestra "Hello World!" en `http://localhost:3000`
- [ ] Postman puede conectarse a `http://localhost:3000`

---

## 🚀 Comando Rápido para Iniciar

```powershell
cd C:\nala-api; npm run start:dev
```

Este comando:
1. Cambia al directorio del backend
2. Inicia el servidor en modo desarrollo
3. Muestra los logs en tiempo real

**Mantén esta terminal abierta** mientras uses la API.


