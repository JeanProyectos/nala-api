# 🚨 IMPORTANTE: Eliminar CNAME Primero

## ❌ Problema

Cuando intentas crear un nuevo registro, la opción "Tunnel" **NO aparece** en el dropdown de Type.

**Causa:** Cloudflare no permite tener un registro CNAME y un Tunnel con el mismo nombre. Debes eliminar el CNAME primero.

## ✅ Solución: Eliminar CNAME Primero

### PASO 1: Eliminar el Registro CNAME

1. **NO uses "Add record" todavía**
2. En la **tabla de registros existentes**, busca:
   - **Type:** `CNAME`
   - **Name:** `nala-api`
   - **Content:** `mundialpet-tunnel.cfargotunnel.com`

3. **Click en el botón "Edit"** de ese registro CNAME (el que tiene el icono de lápiz o "Edit")

4. En la ventana que se abre, busca el botón **"Delete"** o **"Eliminar"** (generalmente es rojo)

5. **Confirma la eliminación**

6. **Espera 10-20 segundos** para que Cloudflare procese la eliminación

### PASO 2: Ahora Crear el Tunnel

**SOLO DESPUÉS de eliminar el CNAME:**

1. Click en **"+ Add record"**

2. En el dropdown **"Type"**, ahora deberías ver:
   - A
   - AAAA
   - CNAME
   - **Tunnel** ← Esta opción debería aparecer ahora
   - MX
   - TXT
   - etc.

3. Selecciona **"Tunnel"**

4. Configura:
   - **Name:** `nala-api`
   - **Tunnel:** Selecciona `mundialpet-tunnel` (aparecerá un dropdown con los túneles disponibles)
   - **Proxy status:** `Proxied` (naranja ☁️)
   - **TTL:** `Auto`

5. Click en **"Save"**

## 🔍 Verificación

Después de guardar, en la tabla deberías ver:

| Type | Name | Content | Proxy status |
|------|------|---------|--------------|
| Tunnel | api | mundialpet-tunnel | Proxied |
| **Tunnel** | **nala-api** | **mundialpet-tunnel** | **Proxied** |
| Tunnel | patasypelos.xyz | mundialpet-tunnel | Proxied |

## ⚠️ Si Aún No Aparece "Tunnel"

1. **Recarga la página completa** (F5 o Ctrl+F5)
2. **Limpia la caché del navegador** (Ctrl+Shift+Delete)
3. **Prueba en modo incógnito** (Ctrl+Shift+N)
4. **Verifica que el CNAME fue eliminado** - No debe aparecer en la tabla

## 📝 Nota Importante

- **NO puedes tener CNAME y Tunnel al mismo tiempo** para el mismo nombre
- **Debes eliminar primero, luego crear**
- **Espera unos segundos** entre eliminar y crear

---

**✅ PASO CRÍTICO: Elimina el CNAME primero, luego la opción Tunnel aparecerá.**
