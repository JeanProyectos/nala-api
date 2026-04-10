# 🔍 Diagnóstico: Túnel No Conecta

## ❌ Problema

- ✅ `http://localhost:3000` funciona
- ❌ `https://nala-api.patasypelos.xyz` NO funciona (Error 530)

## 🔍 Posibles Causas

### 1. DNS Tipo CNAME (Más Probable)

El DNS está configurado como **CNAME** en lugar de **Tunnel**:
- Tipo: `CNAME`
- Target: `mundialpet-tunnel.cfargotunnel.com`

**Solución:** Cambiar a tipo Tunnel (aunque CNAME debería funcionar, a veces causa problemas)

### 2. Túnel No Puede Alcanzar localhost:3000

El túnel puede tener problemas para conectarse a `localhost:3000`.

**Solución:** Verificar que Node.js esté escuchando en `0.0.0.0:3000` o `127.0.0.1:3000`

### 3. Túnel Necesita Más Tiempo

El túnel puede tardar 1-2 minutos en conectarse completamente.

**Solución:** Esperar y probar nuevamente

## ✅ Soluciones

### Solución 1: Cambiar DNS a Tunnel (Recomendado)

1. Ve a Cloudflare DNS
2. Elimina el registro CNAME de `nala-api`
3. Crea un nuevo registro:
   - Type: `Tunnel`
   - Name: `nala-api`
   - Tunnel: `mundialpet-tunnel`
   - Proxy: `Proxied`
4. Espera 1-2 minutos
5. Prueba nuevamente

### Solución 2: Verificar Configuración del Túnel

Verifica que el archivo `~/.cloudflared/config.yml` tenga:

```yaml
ingress:
  - hostname: nala-api.patasypelos.xyz
    service: http://localhost:3000
    originRequest:
      httpHostHeader: nala-api.patasypelos.xyz
```

### Solución 3: Verificar Logs del Túnel

Los logs del túnel pueden mostrar el error específico:

```powershell
# Ver logs del túnel (si está configurado)
Get-Content "C:\Users\Patas y Pelos\.cloudflared\*.log" -Tail 50
```

### Solución 4: Reiniciar Todo

```powershell
# 1. Detener todo
Get-Process -Name node | Stop-Process -Force
Stop-Process -Name cloudflared -Force

# 2. Esperar
Start-Sleep -Seconds 5

# 3. Reiniciar Node.js
cd "C:\inetpub\wwwroot\nala-api"
Start-Process -FilePath "C:\Program Files\nodejs\node.exe" -ArgumentList "dist\src\main.js" -WindowStyle Hidden

# 4. Reiniciar túnel
cd "C:\Proyectos Jean Git\nala-api"
.\INICIAR_TUNEL.ps1

# 5. Esperar 30-60 segundos
Start-Sleep -Seconds 30

# 6. Probar
Invoke-WebRequest -Uri "https://nala-api.patasypelos.xyz" -UseBasicParsing
```

## 🧪 Verificación

Después de aplicar una solución:

1. **Verificar que Node.js esté corriendo:**
   ```powershell
   Get-Process -Name node
   netstat -ano | findstr ":3000"
   ```

2. **Verificar que el túnel esté corriendo:**
   ```powershell
   Get-Process -Name cloudflared
   ```

3. **Probar localmente:**
   ```
   http://localhost:3000
   ```

4. **Probar públicamente:**
   ```
   https://nala-api.patasypelos.xyz
   ```

## 📝 Nota Importante

El error 530 generalmente significa que:
- El túnel no puede alcanzar el servicio local
- O hay un problema con la configuración DNS

Si el CNAME no funciona, definitivamente intenta cambiar a Tunnel.

---

**✅ Prueba primero: Cambiar DNS de CNAME a Tunnel**
