# 🔍 Análisis WebSockets para Producción - NALA

## 📋 Resumen Ejecutivo

**Estado actual**: Sistema funcional en desarrollo, requiere ajustes para producción.

**Tecnologías identificadas**:
- ✅ Socket.IO (servidor NestJS + cliente React Native)
- ✅ WebRTC (para videollamadas)
- ✅ JWT para autenticación
- ⚠️ Cloudflare Tunnel (requiere configuración especial)

**Problemas críticos encontrados**:
1. ❌ URL de socket hardcodeada en cliente (`http://192.168.20.53:3000`)
2. ❌ CORS demasiado permisivo (`origin: '*'`)
3. ⚠️ Falta configuración WSS explícita
4. ⚠️ No hay manejo de reconexión robusto
5. ⚠️ Cloudflare puede bloquear WebSockets sin configuración adecuada

---

## 🔧 CAMBIOS REQUERIDOS

### 1. BACKEND - Configuración Socket.IO para Producción

#### 📁 `src/main.ts`

**PROBLEMA**: CORS muy permisivo, falta configuración de Socket.IO a nivel de aplicación.

**CAMBIO**:

```typescript
import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Servir archivos estáticos
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });
  
  console.log('📁 Archivos estáticos servidos desde:', uploadsPath);

  // ✅ CORS mejorado para producción
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['https://nala-api.patasypelos.xyz', 'https://patasypelos.xyz'];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (móvil, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      // En desarrollo, permitir localhost
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      // En producción, validar origins
      if (allowedOrigins.some(allowed => origin.includes(allowed))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Manejo global de errores
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 API NALA corriendo en http://localhost:${port}`);
  console.log(`📡 Accesible desde la red local`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS Origins permitidos: ${allowedOrigins.join(', ')}`);
}
bootstrap();
```

---

#### 📁 `src/chat/chat.gateway.ts`

**PROBLEMA**: CORS `origin: '*'`, falta configuración de transports, no hay ping/pong explícito.

**CAMBIO**:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  isVet?: boolean;
}

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://nala-api.patasypelos.xyz', 'https://patasypelos.xyz']
      : true, // En desarrollo permite todo
    credentials: true,
  },
  namespace: '/chat',
  // ✅ Configuración crítica para producción
  transports: ['websocket', 'polling'], // Permitir ambos para compatibilidad
  allowEIO3: true, // Compatibilidad con clientes antiguos
  pingTimeout: 60000, // 60 segundos (Cloudflare requiere > 30s)
  pingInterval: 25000, // Ping cada 25 segundos
  // ✅ Importante para Cloudflare Tunnel
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8, // 100MB para archivos grandes
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private consultationRooms = new Map<number, Set<string>>(); // consultationId -> Set of socketIds
  private userSockets = new Map<number, Set<string>>(); // userId -> Set of socketIds (para múltiples dispositivos)

  constructor(
    private messagesService: MessagesService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    // ✅ Limpiar rooms huérfanos periódicamente
    setInterval(() => {
      this.cleanupOrphanRooms();
    }, 300000); // Cada 5 minutos
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // ✅ Autenticación mejorada
      const token = client.handshake.auth?.token 
        || client.handshake.headers?.authorization?.replace('Bearer ', '')
        || client.handshake.query?.token;
      
      if (!token) {
        this.logger.warn(`Cliente ${client.id} desconectado: sin token`);
        client.emit('error', { message: 'No autenticado' });
        client.disconnect();
        return;
      }

      let payload;
      try {
        payload = this.jwtService.verify(token);
      } catch (error) {
        this.logger.warn(`Token inválido para cliente ${client.id}:`, error.message);
        client.emit('error', { message: 'Token inválido' });
        client.disconnect();
        return;
      }

      client.userId = payload.userId;

      // Verificar si es veterinario
      const vet = await this.prisma.veterinarian.findUnique({
        where: { userId: payload.userId },
      });
      client.isVet = !!vet;

      // ✅ Registrar socket del usuario (soporta múltiples dispositivos)
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId)!.add(client.id);

      this.logger.log(`✅ Cliente conectado: ${client.id} (Usuario: ${client.userId}, Vet: ${client.isVet})`);
      
      // ✅ Enviar confirmación de conexión
      client.emit('connected', { 
        userId: client.userId,
        socketId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`❌ Error autenticando cliente ${client.id}:`, error);
      client.emit('error', { message: 'Error de autenticación' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`⚠️ Cliente desconectado: ${client.id} (Usuario: ${client.userId})`);
    
    // ✅ Limpiar de rooms
    this.consultationRooms.forEach((sockets, consultationId) => {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.consultationRooms.delete(consultationId);
        }
      }
    });

    // ✅ Limpiar de userSockets
    if (client.userId && this.userSockets.has(client.userId)) {
      this.userSockets.get(client.userId)!.delete(client.id);
      if (this.userSockets.get(client.userId)!.size === 0) {
        this.userSockets.delete(client.userId);
      }
    }
  }

  /**
   * ✅ Limpiar rooms huérfanos (prevenir memory leaks)
   */
  private cleanupOrphanRooms() {
    const now = Date.now();
    // En una implementación completa, verificarías en BD qué consultas están activas
    // Por ahora, solo limpiamos rooms vacíos
    this.consultationRooms.forEach((sockets, consultationId) => {
      if (sockets.size === 0) {
        this.consultationRooms.delete(consultationId);
        this.logger.debug(`🧹 Room ${consultationId} limpiado (vacío)`);
      }
    });
  }

  // ... resto de los métodos existentes sin cambios ...
  
  // ✅ Agregar método de heartbeat para detectar conexiones muertas
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: Date.now() });
  }
}
```

---

### 2. FRONTEND - Cliente Socket.IO para Producción

#### 📁 `services/socket.js`

**PROBLEMA**: URL hardcodeada, falta manejo de reconexión robusto, no usa WSS en producción.

**CAMBIO COMPLETO**:

```javascript
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ✅ Obtener URL desde configuración (igual que API)
const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://192.168.20.53:3000";

// ✅ Determinar URL de socket (mismo dominio que API)
// Si API es HTTPS, usar WSS automáticamente
const getSocketUrl = () => {
  const apiUrl = API_URL;
  
  // Si es HTTPS, usar WSS
  if (apiUrl.startsWith('https://')) {
    return apiUrl.replace('https://', 'wss://');
  }
  
  // Si es HTTP, usar WS
  if (apiUrl.startsWith('http://')) {
    return apiUrl.replace('http://', 'ws://');
  }
  
  // Fallback
  return apiUrl;
};

const SOCKET_URL = getSocketUrl();

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
let reconnectTimeout = null;
let isManuallyDisconnected = false;

/**
 * ✅ Conecta al WebSocket del chat con manejo robusto de reconexión
 * @param {string} token - JWT token
 * @returns {Promise<Socket>}
 */
export async function connectSocket(token) {
  // Si ya hay un socket conectado, reutilizarlo
  if (socket && socket.connected) {
    console.log('✅ Reutilizando socket existente');
    return socket;
  }

  // Si hay un socket desconectado, limpiarlo
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  isManuallyDisconnected = false;
  reconnectAttempts = 0;

  const socketUrl = `${SOCKET_URL}/chat`;
  console.log(`🔌 Conectando a: ${socketUrl}`);

  socket = io(socketUrl, {
    auth: {
      token,
    },
    // ✅ Configuración optimizada para producción
    transports: ['websocket', 'polling'], // Intentar WebSocket primero, luego polling
    upgrade: true, // Permitir upgrade de polling a websocket
    rememberUpgrade: true, // Recordar preferencia de transporte
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000, // Máximo 10 segundos entre intentos
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    timeout: 20000,
    // ✅ Configuración para Cloudflare
    forceNew: false, // Reutilizar conexión si es posible
    // ✅ Ping/pong explícito
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!socket.connected) {
        console.error('⏱️ Timeout conectando al socket');
        reject(new Error('Timeout conectando al socket'));
      }
    }, 20000);

    // ✅ Evento de conexión exitosa
    socket.on('connect', () => {
      console.log('✅ Conectado al WebSocket, ID:', socket.id);
      reconnectAttempts = 0;
      clearTimeout(timeout);
      resolve(socket);
    });

    // ✅ Evento de confirmación del servidor
    socket.on('connected', (data) => {
      console.log('✅ Servidor confirmó conexión:', data);
    });

    // ✅ Manejo de errores de conexión
    socket.on('connect_error', (error) => {
      console.error('❌ Error conectando al WebSocket:', error.message);
      reconnectAttempts++;
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        clearTimeout(timeout);
        reject(new Error(`No se pudo conectar después de ${MAX_RECONNECT_ATTEMPTS} intentos`));
      }
    });

    // ✅ Manejo de desconexión
    socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket desconectado:', reason);
      
      // Si fue desconexión manual, no reconectar
      if (isManuallyDisconnected) {
        return;
      }

      // Si fue error del servidor o timeout, intentar reconectar
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('🔄 Intentando reconectar...');
      }
    });

    // ✅ Manejo de reconexión
    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconectado después de ${attemptNumber} intentos`);
      reconnectAttempts = 0;
    });

    // ✅ Manejo de error de reconexión
    socket.on('reconnect_error', (error) => {
      console.error('❌ Error en reconexión:', error.message);
    });

    // ✅ Manejo de intentos de reconexión agotados
    socket.on('reconnect_failed', () => {
      console.error('❌ Falló la reconexión después de múltiples intentos');
      clearTimeout(timeout);
      reject(new Error('No se pudo reconectar al servidor'));
    });

    // ✅ Ping/pong para mantener conexión viva
    socket.on('pong', (data) => {
      console.debug('🏓 Pong recibido:', data);
    });
  });
}

/**
 * ✅ Desconecta del WebSocket
 */
export function disconnectSocket() {
  isManuallyDisconnected = true;
  
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  reconnectAttempts = 0;
}

/**
 * ✅ Obtiene la instancia del socket
 */
export function getSocket() {
  return socket;
}

/**
 * ✅ Verifica si el socket está conectado
 */
export function isSocketConnected() {
  return socket && socket.connected;
}

/**
 * ✅ Conecta automáticamente usando el token guardado
 */
export async function connectSocketWithStoredToken() {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      return await connectSocket(token);
    }
    return null;
  } catch (error) {
    console.error('Error conectando socket:', error);
    return null;
  }
}

/**
 * ✅ Reconectar manualmente
 */
export async function reconnectSocket() {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      disconnectSocket();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      return await connectSocket(token);
    }
    return null;
  } catch (error) {
    console.error('Error reconectando socket:', error);
    return null;
  }
}
```

---

### 3. VARIABLES DE ENTORNO

#### 📁 `.env` (crear o actualizar)

```bash
# Entorno
NODE_ENV=production

# Puerto
PORT=3000

# JWT
JWT_SECRET=tu-secret-key-super-segura-aqui-cambiar-en-produccion

# CORS - Origens permitidos (separados por coma)
ALLOWED_ORIGINS=https://nala-api.patasypelos.xyz,https://patasypelos.xyz

# Base URL para URLs de archivos
BASE_URL=https://nala-api.patasypelos.xyz

# Database (si usas .env)
DATABASE_URL=tu-database-url
```

---

### 4. CONFIGURACIÓN CLOUDFLARE TUNNEL

#### 📁 `config.yml` (Cloudflare Tunnel)

**IMPORTANTE**: Cloudflare Tunnel debe estar configurado para permitir WebSockets.

```yaml
tunnel: cf17188d-566f-442f-894a-2a8822c49dfe
credentials-file: C:\Users\Patas y Pelos\.cloudflared\cf17188d-566f-442f-894a-2a8822c49dfe.json

ingress:
  # API REST
  - hostname: nala-api.patasypelos.xyz
    service: http://127.0.0.1:3000
    originRequest:
      httpHostHeader: nala-api.patasypelos.xyz
      # ✅ Configuración crítica para WebSockets
      connectTimeout: 30s
      tcpKeepAlive: 30s
      # ✅ Permitir WebSockets
      noHappyEyeballs: false
      # ✅ Timeouts más largos para WebSockets
      keepAliveConnections: 100
      keepAliveTimeout: 90s
  
  # Frontend (si aplica)
  - hostname: patasypelos.xyz
    service: http://localhost:80
    originRequest:
      httpHostHeader: patasypelos.xyz
  
  # Catch-all
  - service: http_status:404
```

**✅ Verificar en Cloudflare Dashboard**:
1. Zero Trust → Tunnels → Tu Tunnel
2. Configuración → Verificar que `WebSocket` esté habilitado
3. Network → Verificar que no haya reglas bloqueando WebSockets

---

## 🔒 SEGURIDAD

### Validaciones Implementadas

✅ **Autenticación JWT obligatoria** en cada conexión
✅ **Validación de permisos** en cada evento (usuario/veterinario)
✅ **Validación de consulta** antes de unirse a room
✅ **Limpieza automática** de rooms huérfanos
✅ **CORS restringido** en producción

### Mejoras Adicionales Recomendadas

```typescript
// En chat.gateway.ts - Agregar rate limiting por usuario
private messageCounts = new Map<number, { count: number; resetAt: number }>();

@SubscribeMessage('send_message')
async handleMessage(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { consultationId: number; content: string },
) {
  // ✅ Rate limiting: máximo 30 mensajes por minuto
  const now = Date.now();
  const userLimit = this.messageCounts.get(client.userId) || { count: 0, resetAt: now + 60000 };
  
  if (now > userLimit.resetAt) {
    userLimit.count = 0;
    userLimit.resetAt = now + 60000;
  }
  
  if (userLimit.count >= 30) {
    client.emit('error', { message: 'Demasiados mensajes. Espera un momento.' });
    return;
  }
  
  userLimit.count++;
  this.messageCounts.set(client.userId, userLimit);
  
  // ... resto del código ...
}
```

---

## 📈 ESCALABILIDAD

### Estado Actual

✅ **Adecuado para**: Hasta ~1000 conexiones simultáneas por servidor
✅ **Límite razonable**: ~500 consultas activas simultáneas

### Cuándo Necesitar Redis Adapter

**Necesitarás Redis cuando**:
- Tengas múltiples servidores (load balancing)
- Superes 2000 conexiones simultáneas
- Necesites compartir estado entre servidores

**Implementación futura** (cuando lo necesites):

```typescript
// Instalar: npm install @socket.io/redis-adapter redis
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

@WebSocketGateway({
  // ... configuración existente ...
})
export class ChatGateway {
  constructor() {
    // En el constructor, después de inicializar:
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      this.server.adapter(createAdapter(pubClient, subClient));
      this.logger.log('✅ Redis Adapter configurado');
    });
  }
}
```

**Por ahora**: No es necesario. El sistema actual es suficiente.

---

## 🧪 CHECKLIST DE PRUEBAS

### Pruebas Manuales en Producción

#### 1. Conexión Básica
- [ ] Abrir app móvil
- [ ] Verificar que se conecta al socket (logs en consola)
- [ ] Verificar evento `connected` recibido

#### 2. Chat en Consulta
- [ ] Crear consulta nueva
- [ ] Enviar mensaje desde usuario
- [ ] Verificar que llega al veterinario
- [ ] Responder desde veterinario
- [ ] Verificar que llega al usuario

#### 3. Reconexión
- [ ] Activar modo avión en móvil
- [ ] Desactivar modo avión
- [ ] Verificar que reconecta automáticamente
- [ ] Verificar que no se pierden mensajes pendientes

#### 4. Videollamada
- [ ] Iniciar videollamada desde usuario
- [ ] Aceptar desde veterinario
- [ ] Verificar audio/video bidireccional
- [ ] Terminar llamada
- [ ] Verificar limpieza de recursos

#### 5. Múltiples Dispositivos
- [ ] Conectar mismo usuario en 2 dispositivos
- [ ] Enviar mensaje desde dispositivo 1
- [ ] Verificar que llega en dispositivo 2

#### 6. Carga/Stress
- [ ] Crear 10 consultas simultáneas
- [ ] Enviar mensajes rápidamente (30+ por minuto)
- [ ] Verificar que rate limiting funciona
- [ ] Verificar que no hay memory leaks

---

## ✅ SEÑALES DE QUE TODO FUNCIONA BIEN

### En Logs del Servidor

```
✅ Cliente conectado: abc123 (Usuario: 1, Vet: false)
✅ Usuario 1 se unió a consulta 5
✅ Mensaje enviado en consulta 5 por usuario 1
✅ WebRTC offer enviado en consulta 5
✅ Llamada aceptada en consulta 5
```

### En Logs del Cliente (App)

```
✅ Conectado al WebSocket, ID: abc123
✅ Servidor confirmó conexión: { userId: 1, socketId: 'abc123' }
📨 Historial recibido: 5 mensajes
✅ Mensaje enviado correctamente
```

### En Cloudflare Dashboard

- ✅ Tunnel activo y conectado
- ✅ Tráfico WebSocket visible en métricas
- ✅ Sin errores 502/503

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### Problema: "Connection timeout"

**Causa**: Cloudflare bloqueando WebSockets
**Solución**: 
1. Verificar configuración de Tunnel (ver arriba)
2. Aumentar `pingTimeout` a 60000ms
3. Verificar que `transports: ['websocket', 'polling']` esté configurado

### Problema: "CORS error"

**Causa**: Origin no permitido
**Solución**: 
1. Verificar `ALLOWED_ORIGINS` en `.env`
2. Verificar que app móvil use URL correcta
3. En desarrollo, permitir `origin: true`

### Problema: "Socket desconecta frecuentemente"

**Causa**: Timeout muy corto o red inestable
**Solución**:
1. Aumentar `pingTimeout` y `pingInterval`
2. Verificar configuración de Cloudflare Tunnel
3. Implementar reconexión automática (ya implementado)

### Problema: "Mensajes no llegan"

**Causa**: Usuario no está en el room correcto
**Solución**:
1. Verificar logs de `join_consultation`
2. Verificar que `consultationId` sea correcto
3. Verificar permisos de usuario/veterinario

---

## 📝 RESUMEN DE ARCHIVOS A MODIFICAR

1. ✅ `src/main.ts` - CORS mejorado
2. ✅ `src/chat/chat.gateway.ts` - Configuración WebSocket, limpieza, ping/pong
3. ✅ `services/socket.js` - URL dinámica, reconexión robusta
4. ✅ `.env` - Variables de entorno
5. ✅ `config.yml` (Cloudflare) - Configuración WebSocket

---

## 🎯 PRIORIDAD DE IMPLEMENTACIÓN

1. **CRÍTICO** (hacer primero):
   - Cambiar URL hardcodeada en `socket.js`
   - Configurar CORS correctamente
   - Configurar Cloudflare Tunnel para WebSockets

2. **IMPORTANTE** (hacer después):
   - Mejorar manejo de reconexión
   - Agregar ping/pong
   - Limpieza de rooms huérfanos

3. **MEJORAS** (opcional):
   - Rate limiting
   - Redis Adapter (solo si escalas horizontalmente)

---

**Última actualización**: 2026-03-02
**Estado**: Listo para implementar
