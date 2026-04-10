/**
 * Script de diagnóstico para probar conexión WebSocket
 * Uso: node test-websocket.js
 */

const { io } = require('socket.io-client');

// Configuración
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';
const TOKEN = process.env.TEST_TOKEN || 'test-token'; // Necesitas un token válido

console.log('🧪 Iniciando prueba de WebSocket...');
console.log(`🔌 URL: ${SOCKET_URL}/chat`);
console.log(`🔑 Token: ${TOKEN.substring(0, 20)}...`);

const socket = io(`${SOCKET_URL}/chat`, {
  auth: {
    token: TOKEN,
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  timeout: 20000,
});

// Eventos de conexión
socket.on('connect', () => {
  console.log('✅ Conectado al WebSocket');
  console.log(`📡 Socket ID: ${socket.id}`);
  
  // Probar join_consultation (necesitas un consultationId válido)
  const testConsultationId = process.env.TEST_CONSULTATION_ID || 1;
  console.log(`\n🔍 Probando join_consultation con ID: ${testConsultationId}`);
  
  socket.emit('join_consultation', { consultationId: testConsultationId }, (response) => {
    if (response && response.error) {
      console.error('❌ Error al unirse:', response.error);
    } else {
      console.log('✅ Unido exitosamente:', response);
    }
  });
});

socket.on('connected', (data) => {
  console.log('✅ Servidor confirmó conexión:', data);
});

socket.on('message_history', (messages) => {
  console.log(`📨 Historial recibido: ${messages?.length || 0} mensajes`);
});

socket.on('new_message', (message) => {
  console.log('💬 Nuevo mensaje:', message);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
});

socket.on('connect_error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  console.error('💡 Verifica que:');
  console.error('   1. El servidor esté corriendo');
  console.error('   2. El token sea válido');
  console.error('   3. El namespace /chat esté configurado');
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.warn('⚠️ Desconectado:', reason);
});

// Probar ping
setTimeout(() => {
  console.log('\n🏓 Enviando ping...');
  socket.emit('ping');
}, 2000);

socket.on('pong', (data) => {
  console.log('✅ Pong recibido:', data);
});

// Cerrar después de 10 segundos
setTimeout(() => {
  console.log('\n🔚 Cerrando conexión...');
  socket.disconnect();
  process.exit(0);
}, 10000);
