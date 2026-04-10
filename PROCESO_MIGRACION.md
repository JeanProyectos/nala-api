# 🔄 Proceso de Migración del Túnel

## 📍 Paso 1: Verificación del Túnel (Actual)

**Estado:**
- ✅ Túnel: `mundialpet-tunnel`
- ✅ Conectores: 2 conectados
- ✅ Versión: 2026.2.0
- ✅ Estado: Connected

**Acción:**
- Click en **"Confirm"** (botón azul) para continuar

## 📍 Paso 2: Preview de Configuraciones de Hostnames

En este paso verás un **preview** de todas las configuraciones que se migrarán:

**Deberías ver:**
- `patasypelos.xyz` → `http://localhost:80`
- `api.patasypelos.xyz` → `http://localhost:80`
- `nala-api.patasypelos.xyz` → `http://127.0.0.1:3000` ✅
- `api-nala.patasypelos.xyz` → `http://localhost:3000`

**Verifica que:**
- ✅ `nala-api.patasypelos.xyz` esté en la lista
- ✅ Apunte a `http://127.0.0.1:3000` o `http://localhost:3000`
- ✅ Todos los hostnames estén correctos

**Si algo está mal:**
- Puedes hacer click en **"Cancel and exit"** en cualquier momento
- Edita el `config.yml` y vuelve a intentar

**Si todo está bien:**
- Click en **"Confirm"** para continuar

## 📍 Paso 3: Preview de Private Networks

Este paso muestra las redes privadas (si las hay).

**Acción:**
- Revisa y click en **"Confirm"**

## 📍 Paso 4: Finalizar Migración

Este es el paso final donde se completa la migración.

**Acción:**
- Click en **"Finalize migration"** o **"Confirm"**
- La migración se completará sin downtime

## ✅ Después de la Migración

1. **Ve a:** Networks → Connectors → Tunnels → mundialpet-tunnel
2. **Busca:** "Public Hostnames" o "Routes"
3. **Verifica** que todos los hostnames estén ahí, incluyendo `nala-api.patasypelos.xyz`
4. **Prueba:** `https://nala-api.patasypelos.xyz`

## ⚠️ Importante

- Puedes **cancelar** en cualquier momento antes del paso 4
- La migración es **sin downtime**
- Después de migrar, podrás gestionar hostnames desde el dashboard

---

**✅ Continúa con el proceso: Click en "Confirm" para ver el preview de hostnames**
