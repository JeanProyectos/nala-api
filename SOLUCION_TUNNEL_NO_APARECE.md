# 🔧 Solución: "Tunnel" No Aparece en el Dropdown

## ❌ Problema

Ya eliminaste el CNAME pero la opción "Tunnel" **NO aparece** en el dropdown de Type cuando intentas crear un nuevo registro.

## ✅ Soluciones (Prueba en este orden)

### Solución 1: Recargar la Página Completa

1. **Presiona F5** o **Ctrl+F5** (recarga forzada, sin caché)
2. O **cierra y vuelve a abrir el navegador**
3. Vuelve a la página de DNS records
4. Click en **"+ Add record"**
5. Verifica si ahora aparece "Tunnel" en el dropdown

### Solución 2: Limpiar Caché del Navegador

1. Presiona **Ctrl+Shift+Delete**
2. Selecciona "Cached images and files"
3. Click en "Clear data"
4. Recarga la página (F5)
5. Intenta crear el registro nuevamente

### Solución 3: Usar Modo Incógnito

1. Abre una **ventana incógnito** (Ctrl+Shift+N en Chrome/Edge)
2. Inicia sesión en Cloudflare
3. Ve a: DNS → Records
4. Click en **"+ Add record"**
5. Verifica si aparece "Tunnel"

### Solución 4: Verificar que el CNAME Fue Eliminado

1. En la **tabla de registros**, busca si aún existe:
   - Type: `CNAME`
   - Name: `nala-api`
2. Si **aún aparece**, elimínalo nuevamente
3. Espera **30-60 segundos**
4. Intenta crear el registro nuevamente

### Solución 5: Esperar Más Tiempo

Cloudflare puede tardar en actualizar la interfaz:

1. **Espera 1-2 minutos** después de eliminar el CNAME
2. **Recarga la página** (F5)
3. Intenta crear el registro nuevamente

### Solución 6: Usar Cloudflare CLI (Alternativa)

Si nada funciona, puedes usar la línea de comandos:

```powershell
# Instalar cloudflared CLI si no lo tienes
# Luego ejecutar:
cloudflared tunnel route dns nala-api.patasypelos.xyz mundialpet-tunnel
```

## 🔍 Verificación

Después de aplicar una solución, verifica:

1. **En el dropdown Type**, deberías ver:
   - A
   - AAAA
   - CNAME
   - **Tunnel** ← Debe aparecer aquí
   - MX
   - TXT
   - etc.

2. **En la tabla de registros**, NO debe haber:
   - Type: `CNAME`, Name: `nala-api`

## 📝 Notas Importantes

- **La opción "Tunnel" solo aparece** si no hay conflictos con otros registros
- **Cloudflare puede tardar** en actualizar la interfaz después de eliminar registros
- **El caché del navegador** puede mostrar información antigua

## 🚨 Si Nada Funciona

1. **Contacta el soporte de Cloudflare** - Puede ser un problema de la interfaz
2. **Usa la API de Cloudflare** para crear el registro programáticamente
3. **Verifica tus permisos** - Asegúrate de tener permisos para crear registros Tunnel

---

**✅ Prueba primero: Recargar la página con Ctrl+F5**
