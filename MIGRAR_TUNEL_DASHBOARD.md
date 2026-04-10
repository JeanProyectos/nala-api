# 🔄 Migrar Túnel al Dashboard de Cloudflare

## 📍 Situación Actual

Tu túnel `mundialpet-tunnel` está configurado **localmente** usando el archivo `config.yml`.

**Por eso:**
- No puedes agregar hostnames desde el dashboard
- No aparece la sección "Public Hostnames" en el dashboard
- Cloudflare te ofrece migrar al dashboard

## ✅ Opción 1: Migrar al Dashboard (Recomendado)

### Ventajas:
- ✅ Puedes gestionar hostnames desde el dashboard
- ✅ Más fácil de usar
- ✅ Interfaz visual
- ✅ No necesitas editar archivos

### Desventajas:
- ⚠️ **Es IRREVERSIBLE** (no puedes volver atrás)
- ⚠️ Solo migra las reglas de ingress (hostnames)
- ⚠️ Otras configuraciones del archivo no se migran

### Pasos para Migrar:

1. **Click en "Start migration"** (botón azul)

2. **Cloudflare migrará automáticamente:**
   - `patasypelos.xyz` → `localhost:80`
   - `api.patasypelos.xyz` → `localhost:80`
   - `nala-api.patasypelos.xyz` → `localhost:3000` (si está en config.yml)
   - `api-nala.patasypelos.xyz` → `localhost:3000` (si está en config.yml)

3. **Después de migrar:**
   - Podrás ver y gestionar hostnames desde el dashboard
   - Podrás agregar nuevos hostnames fácilmente
   - El archivo `config.yml` seguirá existiendo pero el dashboard tendrá prioridad

## ⚠️ Opción 2: Continuar con Configuración Local

Si **NO quieres migrar**, puedes continuar usando el archivo `config.yml`.

### Verificar que el Túnel Esté Leyendo el Config:

1. **Verifica que el archivo esté correcto:**
   ```powershell
   Get-Content "C:\Users\Patas y Pelos\.cloudflared\config.yml"
   ```

2. **Verifica que el túnel esté usando el archivo:**
   - El túnel debe estar corriendo desde la carpeta `.cloudflared`
   - O debe tener la ruta del archivo especificada

3. **Reinicia el túnel:**
   ```powershell
   Stop-Process -Name cloudflared -Force
   cd "C:\Users\Patas y Pelos\.cloudflared"
   cloudflared tunnel run cf17188d-566f-442f-894a-2a8822c49dfe
   ```

## 🎯 Recomendación

**Migra al dashboard** porque:
- Es más fácil de gestionar
- Ya tienes el hostname en el config.yml, se migrará automáticamente
- Podrás agregar más hostnames fácilmente en el futuro
- El proceso es seguro y sin downtime

## 📝 Después de Migrar

1. **Ve a:** Networks → Connectors → Tunnels → mundialpet-tunnel
2. **Busca:** "Public Hostnames" o "Routes"
3. **Verifica** que `nala-api.patasypelos.xyz` esté en la lista
4. **Si no está**, agrégalo desde el dashboard

---

**✅ Recomendación: Click en "Start migration" para poder gestionar desde el dashboard**
