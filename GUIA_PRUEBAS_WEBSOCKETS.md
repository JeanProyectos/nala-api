# 🧪 Guía de Pruebas WebSockets - Local vs Producción

## 📋 Resumen

**Haz las pruebas en AMBOS entornos**, pero en este orden:
1. **Primero LOCAL** → Verificar que el código funciona
2. **Luego PRODUCCIÓN** → Verificar que funciona con Cloudflare Tunnel

---

## 🔧 PRUEBAS LOCALES (Primero)

### Objetivo
Verificar que el código funciona correctamente antes de subir a producción.

### Configuración Requerida

1. **Backend** (`nala-api`):
   ```bash
   # En .env o variables de entorno
   NODE_ENV=development
   PORT=3000
   ```

2. **Frontend** (`nala-app`):



   ```json
   // En app.json
   "extra": {
     "apiUrl": "http://192.168.20.53:3000"  // Tu IP local
   }
   ```

3. **Iniciar servicios**:
   ```bash
   # Terminal 1: Backend
   cd nala-api
   npm run start:dev

   # Terminal 2: App (si corres en Expo)
   cd nala-app
   npx expo start
   ```

### ✅ Checklist Local

#### 1. Conexión Básica
- [ ] Abrir app en dispositivo/emulador
- [ ] Verificar logs en consola del backend:
  ```
  ✅ Cliente conectado: abc123 (Usuario: 1, Vet: false)
  ```
- [ ] Verificar logs en app:
  ```
  🔌 Conectando a: ws://192.168.20.53:3000/chat
  ✅ Conectado al WebSocket, ID: abc123
  ✅ Servidor confirmó conexión: { userId: 1, socketId: 'abc123' }
  ```

#### 2. Chat en Consulta
- [ ] Crear consulta nueva desde usuario
- [ ] Unirse a consulta (automático al abrir chat)
- [ ] Enviar mensaje desde usuario
- [ ] Verificar que llega al veterinario (si está conectado)
- [ ] Responder desde veterinario
- [ ] Verificar que llega al usuario

#### 3. Reconexión
- [ ] Activar modo avión en móvil
- [ ] Verificar logs: `⚠️ Socket desconectado: transport close`
- [ ] Desactivar modo avión
- [ ] Verificar logs: `✅ Reconectado después de X intentos`
- [ ] Verificar que no se perdieron mensajes

#### 4. Múltiples Dispositivos (Opcional)
- [ ] Conectar mismo usuario en 2 dispositivos
- [ ] Enviar mensaje desde dispositivo 1
- [ ] Verificar que llega en dispositivo 2

### 🚨 Si Algo Falla Localmente

**Problema**: "Connection timeout"
- Verificar que backend está corriendo en puerto 3000
- Verificar que IP es correcta (`192.168.20.53`)
- Verificar firewall no bloquea puerto 3000

**Problema**: "CORS error"
- En desarrollo, CORS permite todo (`origin: true`)
- Si falla, verificar que backend está corriendo

**Problema**: "Token inválido"
- Verificar que estás logueado en la app
- Verificar que token no expiró

---

## 🌐 PRUEBAS EN PRODUCCIÓN (Después)

### Objetivo
Verificar que funciona correctamente con Cloudflare Tunnel y HTTPS/WSS.

### Configuración Requerida

1. **Backend** (`nala-api`):
   ```bash
   # En .env
   NODE_ENV=production
   PORT=3000
   ALLOWED_ORIGINS=https://nala-api.patasypelos.xyz,https://patasypelos.xyz
   BASE_URL=https://nala-api.patasypelos.xyz
   ```

2. **Frontend** (`nala-app`):
   ```json
   // En app.json (ya está configurado)
   "extra": {
     "apiUrl": "https://nala-api.patasypelos.xyz"
   }
   ```

3. **Cloudflare Tunnel**:
   - Verificar que está corriendo
   - Verificar que `config.yml` tiene configuración correcta

### ✅ Checklist Producción

#### 1. Conexión Básica
- [ ] Abrir app en dispositivo físico (no emulador)
- [ ] Verificar logs en consola del backend:
  ```
  ✅ Cliente conectado: abc123 (Usuario: 1, Vet: false)
  ```
- [ ] Verificar logs en app:
  ```
  🔌 Conectando a: wss://nala-api.patasypelos.xyz/chat
  ✅ Conectado al WebSocket, ID: abc123
  ✅ Servidor confirmó conexión: { userId: 1, socketId: 'abc123' }
  ```
- [ ] **IMPORTANTE**: Verificar que usa `wss://` (no `ws://`)

#### 2. Chat en Consulta
- [ ] Crear consulta nueva desde usuario
- [ ] Enviar mensaje desde usuario
- [ ] Verificar que llega al veterinario
- [ ] Responder desde veterinario
- [ ] Verificar que llega al usuario

#### 3. Reconexión
- [ ] Activar modo avión en móvil
- [ ] Esperar 10 segundos
- [ ] Desactivar modo avión
- [ ] Verificar reconexión automática
- [ ] Verificar que mensajes pendientes llegan

#### 4. Videollamada (Si aplica)
- [ ] Iniciar videollamada desde usuario
- [ ] Aceptar desde veterinario
- [ ] Verificar audio/video bidireccional
- [ ] Terminar llamada
- [ ] Verificar limpieza de recursos

#### 5. Carga/Stress (Opcional)
- [ ] Crear 5 consultas simultáneas
- [ ] Enviar mensajes rápidamente
- [ ] Verificar que no hay errores
- [ ] Verificar que mensajes llegan en orden

### 🚨 Si Algo Falla en Producción

**Problema**: "Connection timeout"
1. Verificar Cloudflare Tunnel está activo:
   ```powershell
   # Verificar proceso
   Get-Process cloudflared
   ```
2. Verificar logs de Tunnel:
   - Buscar errores en la consola donde corre `cloudflared`
3. Verificar configuración en `config.yml`:
   - `connectTimeout: 30s`
   - `tcpKeepAlive: 30s`
4. Verificar en Cloudflare Dashboard:
   - Zero Trust → Tunnels → Tu Tunnel
   - Verificar que WebSocket esté habilitado

**Problema**: "CORS error"
1. Verificar `ALLOWED_ORIGINS` en `.env`:
   ```bash
   ALLOWED_ORIGINS=https://nala-api.patasypelos.xyz,https://patasypelos.xyz
   ```
2. Verificar que app usa URL correcta (`https://nala-api.patasypelos.xyz`)
3. Reiniciar backend después de cambiar `.env`

**Problema**: "Socket desconecta frecuentemente"
1. Verificar logs de Cloudflare Tunnel
2. Verificar que `pingTimeout: 60000` está configurado
3. Verificar conexión de red estable
4. Verificar que no hay reglas de firewall bloqueando

**Problema**: "Usa ws:// en lugar de wss://"
1. Verificar que `app.json` tiene `apiUrl: "https://nala-api.patasypelos.xyz"`
2. Verificar que función `getSocketUrl()` detecta HTTPS correctamente
3. Rebuild de la app si es necesario

---

## 📊 Comparación Local vs Producción

| Aspecto | Local | Producción |
|---------|-------|------------|
| **URL Socket** | `ws://192.168.20.53:3000` | `wss://nala-api.patasypelos.xyz` |
| **Protocolo** | WS (HTTP) | WSS (HTTPS) |
| **CORS** | Permite todo | Solo origins permitidos |
| **Tunnel** | No necesario | Cloudflare Tunnel requerido |
| **Logs** | Consola local | Consola + Cloudflare Dashboard |

---

## 🎯 Orden Recomendado de Pruebas

### Paso 1: Local (5-10 minutos)
1. ✅ Verificar conexión básica
2. ✅ Probar chat
3. ✅ Probar reconexión

### Paso 2: Producción (10-15 minutos)
1. ✅ Verificar conexión básica (WSS)
2. ✅ Probar chat
3. ✅ Probar reconexión
4. ✅ Probar videollamada (si aplica)

### Paso 3: Monitoreo (Ongoing)
1. ✅ Revisar logs periódicamente
2. ✅ Verificar métricas de Cloudflare
3. ✅ Verificar que no hay memory leaks

---

## ✅ Señales de Éxito

### En Local
- ✅ Conexión inmediata (< 2 segundos)
- ✅ Mensajes llegan instantáneamente
- ✅ Reconexión automática funciona

### En Producción
- ✅ Conexión con WSS (no WS)
- ✅ Mensajes llegan correctamente
- ✅ Sin desconexiones frecuentes
- ✅ Logs muestran actividad normal

---

## 📝 Notas Importantes

1. **Siempre prueba local primero**: Es más rápido y fácil debuggear
2. **Producción requiere dispositivo físico**: Los emuladores pueden tener problemas con WSS
3. **Cloudflare Tunnel debe estar activo**: Sin Tunnel, producción no funciona
4. **Logs son tu mejor amigo**: Revisa tanto backend como Cloudflare Dashboard

---

**Última actualización**: 2026-03-02
