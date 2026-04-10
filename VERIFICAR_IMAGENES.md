# 🔍 Verificación de Imágenes en Producción

## ✅ Cambios Aplicados

1. **URLs unificadas**: Todos los endpoints de upload (`pet-photo`, `user-photo`, `veterinarian-photo`) ahora usan la misma lógica:
   - Si existe `BASE_URL` en `.env`, lo usa
   - Si no, detecta si está en producción y usa `https://nala-api.patasypelos.xyz`
   - Si está en desarrollo, usa `http://192.168.20.53:3000`

## 🔧 Verificaciones Necesarias

### 1. Variable de Entorno BASE_URL

Verifica que el archivo `.env` en producción tenga:
```env
BASE_URL=https://nala-api.patasypelos.xyz
NODE_ENV=production
```

**Ubicación del .env en producción:**
- `C:\inetpub\wwwroot\nala-api\.env`

### 2. Carpetas de Uploads

Verifica que existan las carpetas:
- `C:\inetpub\wwwroot\nala-api\uploads\pets`
- `C:\inetpub\wwwroot\nala-api\uploads\users`
- `C:\inetpub\wwwroot\nala-api\uploads\veterinarians`

**Comando para verificar:**
```powershell
Test-Path "C:\inetpub\wwwroot\nala-api\uploads\pets"
Test-Path "C:\inetpub\wwwroot\nala-api\uploads\users"
Test-Path "C:\inetpub\wwwroot\nala-api\uploads\veterinarians"
```

### 3. Archivos Estáticos

Verifica que `main.ts` esté sirviendo los archivos estáticos correctamente:
- La ruta debe ser: `process.cwd() + '/uploads'`
- El prefijo debe ser: `/uploads`
- Esto significa que las imágenes deben ser accesibles en: `https://nala-api.patasypelos.xyz/uploads/pets/nombre-archivo.jpg`

### 4. Probar Acceso a Imágenes

Prueba acceder directamente a una imagen:
```
https://nala-api.patasypelos.xyz/uploads/pets/[nombre-archivo].jpg
```

Si no carga, verifica:
- Que el archivo existe en la carpeta
- Que los permisos de la carpeta permiten lectura
- Que el servidor está sirviendo archivos estáticos correctamente

## 🐛 Problemas Comunes

### Las imágenes se guardan pero no se muestran

**Causa**: La URL generada no coincide con la ruta de los archivos estáticos.

**Solución**:
1. Verifica que `BASE_URL` esté configurado en `.env`
2. Verifica que `NODE_ENV=production` esté en `.env`
3. Reinicia el servidor Node.js después de cambiar `.env`

### Las imágenes se guardan en una carpeta pero se buscan en otra

**Causa**: `process.cwd()` apunta a diferentes directorios según dónde se ejecute.

**Solución**:
- Asegúrate de que la API en producción se ejecute desde `C:\inetpub\wwwroot\nala-api`
- O usa una ruta absoluta en lugar de `process.cwd()`

### Error 404 al acceder a imágenes

**Causa**: Los archivos estáticos no se están sirviendo correctamente.

**Solución**:
1. Verifica que `app.useStaticAssets()` esté configurado en `main.ts`
2. Verifica que la carpeta `uploads` exista en el directorio raíz
3. Verifica los permisos de la carpeta

## 📝 Logs para Debugging

Cuando subas una imagen, deberías ver en los logs:
```
📸 Foto subida: {
  filename: 'pet-1234567890-123456789.jpeg',
  size: 254235,
  mimetype: 'image/jpeg',
  url: 'https://nala-api.patasypelos.xyz/uploads/pets/pet-1234567890-123456789.jpeg'
}
📁 Archivos estáticos servidos desde: C:\inetpub\wwwroot\nala-api\uploads
```

Si la URL no coincide con `https://nala-api.patasypelos.xyz`, hay un problema con la configuración.

## ✅ Checklist Final

- [ ] `.env` tiene `BASE_URL=https://nala-api.patasypelos.xyz`
- [ ] `.env` tiene `NODE_ENV=production`
- [ ] Carpetas `uploads` existen en producción
- [ ] Permisos de lectura en carpetas `uploads`
- [ ] API reiniciada después de cambios
- [ ] Probar acceso directo a una imagen
- [ ] Verificar logs al subir imagen
