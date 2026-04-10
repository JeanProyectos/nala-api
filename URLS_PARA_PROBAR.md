# 🌐 URLs para Probar NALA API

## ✅ URLs Locales (Desde tu PC)

### Node.js Directo (Sin IIS)
```
http://localhost:3000
http://127.0.0.1:3000
http://localhost:3000/auth/register
http://localhost:3000/auth/login
```

### A través de IIS (Proxy Reverso)
```
http://localhost:3000
http://localhost:3000/auth/register
http://localhost:3000/auth/login
```

**Nota:** IIS hace proxy reverso a Node.js, así que ambas URLs deberían funcionar igual.

## 🌍 URLs Públicas (Desde Internet)

### API Pública
```
https://nala-api.patasypelos.xyz
https://nala-api.patasypelos.xyz/auth/register
https://nala-api.patasypelos.xyz/auth/login
```

## 🧪 Endpoints para Probar

### 1. Health Check (GET)
```
http://localhost:3000
https://nala-api.patasypelos.xyz
```

### 2. Registro de Usuario (POST)
```
URL: http://localhost:3000/auth/register
Método: POST
Content-Type: application/json
Body:
{
  "email": "test@example.com",
  "password": "123456"
}
```

### 3. Login (POST)
```
URL: http://localhost:3000/auth/login
Método: POST
Content-Type: application/json
Body:
{
  "email": "test@example.com",
  "password": "123456"
}
```

## 🔍 Verificación Rápida

### Desde PowerShell:
```powershell
# Probar localmente
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing

# Probar públicamente
Invoke-WebRequest -Uri "https://nala-api.patasypelos.xyz" -UseBasicParsing
```

### Desde Navegador:
1. Abre tu navegador
2. Ve a: `http://localhost:3000`
3. Deberías ver una respuesta JSON o el estado de la API

### Desde Postman o cURL:
```bash
# Health check
curl http://localhost:3000

# Registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

## ⚠️ Notas Importantes

1. **Node.js debe estar corriendo** en el puerto 3000
2. **IIS puede estar detenido** - Node.js funciona independientemente
3. **URL pública** puede tardar 1-2 minutos en funcionar después de reiniciar el túnel

## 🚨 Si No Funciona

### Localmente:
- Verifica que Node.js esté corriendo: `Get-Process -Name node`
- Verifica el puerto: `netstat -ano | findstr ":3000"`
- Revisa los logs de Node.js

### Públicamente:
- Verifica que el túnel esté corriendo: `Get-Process -Name cloudflared`
- Espera 1-2 minutos después de reiniciar el túnel
- Verifica la configuración del túnel en Cloudflare

---

**✅ Prueba primero: `http://localhost:3000` en tu navegador**
