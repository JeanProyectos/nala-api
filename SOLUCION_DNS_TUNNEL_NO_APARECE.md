# 🔧 Solución: Opción "Tunnel" No Aparece en el Dropdown

## ❌ Problema

Cuando intentas agregar un registro nuevo, el dropdown de "Type" no muestra la opción "Tunnel" o muestra "No results".

## ✅ Solución: Eliminar CNAME Primero

### Paso 1: Eliminar el Registro CNAME Existente

1. En la tabla de registros DNS, busca el registro:
   - **Type:** `CNAME`
   - **Name:** `nala-api`
   - **Content:** `mundialpet-tunnel.cfargotunnel.com`

2. Click en el botón **"Edit"** (o el icono de editar) de ese registro

3. En la ventana de edición, click en **"Delete"** o **"Eliminar"**

4. Confirma la eliminación

### Paso 2: Crear Nuevo Registro Tipo Tunnel

**IMPORTANTE:** Después de eliminar el CNAME, la opción "Tunnel" debería aparecer.

1. Click en **"+ Add record"**

2. En el dropdown **"Type"**, ahora deberías ver la opción **"Tunnel"**
   - Si aún no aparece, espera unos segundos y recarga la página

3. Selecciona **"Tunnel"** en el dropdown Type

4. Configura:
   - **Name:** `nala-api`
   - **Tunnel:** Selecciona `mundialpet-tunnel` del dropdown (debería aparecer automáticamente)
   - **Proxy status:** `Proxied` (naranja ☁️)
   - **TTL:** `Auto`

5. Click en **"Save"**

## 🔄 Alternativa: Usar la API de Cloudflare

Si el dropdown sigue sin mostrar "Tunnel", puedes usar la API de Cloudflare o el CLI:

```powershell
# Instalar cloudflared CLI si no lo tienes
# Luego ejecutar:
cloudflared tunnel route dns nala-api.patasypelos.xyz mundialpet-tunnel
```

## 📝 Nota Importante

- **Debes eliminar el CNAME primero** antes de poder crear un Tunnel
- Cloudflare no permite tener ambos tipos para el mismo nombre
- Después de eliminar, espera 10-20 segundos antes de crear el nuevo registro

## ✅ Verificación

Después de crear el registro Tunnel, deberías ver en la tabla:

| Type | Name | Content | Proxy status |
|------|------|---------|--------------|
| Tunnel | api | mundialpet-tunnel | Proxied |
| **Tunnel** | **nala-api** | **mundialpet-tunnel** | **Proxied** |
| Tunnel | patasypelos.xyz | mundialpet-tunnel | Proxied |

## 🚨 Si Aún No Aparece "Tunnel"

1. **Recarga la página** (F5)
2. **Limpia la caché del navegador**
3. **Prueba en modo incógnito**
4. **Verifica que tengas permisos** para crear registros Tunnel en Cloudflare

---

**✅ Después de eliminar el CNAME, la opción Tunnel debería aparecer automáticamente.**
