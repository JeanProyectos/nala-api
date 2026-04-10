# 🔍 Verificar Hostname en el Dashboard

## ❌ Error 1033 Persiste

Después de la migración, el error 1033 puede persistir si:
1. El hostname no está registrado en el dashboard
2. El túnel no está leyendo la configuración del dashboard
3. Hay un problema de sincronización

## ✅ Verificación en el Dashboard

### Paso 1: Ir al Túnel

1. **Ve a:** Networks → Connectors → Tunnels
2. **Click en:** `mundialpet-tunnel`

### Paso 2: Buscar Public Hostnames

Busca una de estas secciones:
- **"Public Hostnames"**
- **"Routes"**
- **"Published application routes"**
- **"Ingress"**

### Paso 3: Verificar que `nala-api.patasypelos.xyz` Esté en la Lista

Deberías ver una tabla con:
- `patasypelos.xyz`
- `api.patasypelos.xyz`
- **`nala-api.patasypelos.xyz`** ← Debe estar aquí
- `api-nala.patasypelos.xyz`

### Paso 4: Si NO Está en la Lista

**Agregar manualmente:**

1. Click en **"+ Add a public hostname"** o **"+ Add hostname route"**

2. Configura:
   - **Subdomain:** `nala-api`
   - **Domain:** `patasypelos.xyz` (selecciona del dropdown)
   - **Service:** `http://127.0.0.1:3000`
   - **Path:** (vacío o `*`)
   - **HTTP Host Header:** `nala-api.patasypelos.xyz` (opcional)

3. Click en **"Save"** o **"Add"**

4. Espera 30-60 segundos

5. Prueba: `https://nala-api.patasypelos.xyz`

## 🔄 Si Está en la Lista pero No Funciona

### Verificar Configuración:

1. **Click en el hostname** `nala-api.patasypelos.xyz` en la lista
2. **Verifica que:**
   - Service: `http://127.0.0.1:3000` o `http://localhost:3000`
   - Path: `*` o vacío
3. **Si está mal, edítalo y guarda**

### Reiniciar el Túnel:

```powershell
Stop-Process -Name cloudflared -Force
Start-Sleep -Seconds 3
cd "C:\Proyectos Jean Git\nala-api"
.\INICIAR_TUNEL.ps1
```

## 📝 Nota Importante

Después de migrar, el túnel **lee la configuración desde el dashboard**, no desde el archivo `config.yml` local.

Si agregas o editas hostnames en el dashboard, el túnel se actualiza automáticamente, pero puede tardar 30-60 segundos.

---

**✅ Verifica primero en el dashboard si `nala-api.patasypelos.xyz` está en la lista de Public Hostnames**
