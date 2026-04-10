# 🧭 Cómo Navegar a Tunnels desde Network

## 📍 Ubicación Actual

Estás en: **Network** (Configuración de red del dominio)

## 🎯 Objetivo

Necesitas llegar a: **Tunnels → mundialpet-tunnel → Public Hostnames**

## ✅ Pasos para Navegar

### Opción 1: Desde el Menú Lateral (Más Rápido)

1. **En el menú lateral izquierdo**, busca una de estas opciones:
   - **"Zero Trust"** o **"Access"** (puede estar más abajo en el menú)
   - O busca **"Connectors"** directamente

2. **Si ves "Zero Trust":**
   - Click en **"Zero Trust"**
   - Luego busca **"Networks"** o **"Connectors"** en el submenú
   - Click en **"Cloudflare Tunnels"** o **"Tunnels"**

3. **Si ves "Connectors":**
   - Click directamente en **"Connectors"**
   - Luego click en **"Cloudflare Tunnels"** o **"Tunnels"**

### Opción 2: Usar la Búsqueda Rápida

1. **Presiona `Ctrl + K`** (o click en "Quick search...")
2. **Escribe:** `tunnels` o `mundialpet-tunnel`
3. **Selecciona** el resultado que diga "Tunnels" o "Cloudflare Tunnels"

### Opción 3: URL Directa

1. **Ve directamente a:**
   ```
   https://one.dash.cloudflare.com/
   ```
2. **En el menú lateral**, busca **"Zero Trust"** o **"Access"**
3. **Navega a:** Networks → Connectors → Cloudflare Tunnels

## 🎯 Una Vez que Estés en Tunnels

1. **Verás una lista de túneles**
2. **Busca:** `mundialpet-tunnel` (debería mostrar Status: HEALTHY)
3. **Click en:** `mundialpet-tunnel` (es un link)

## 📋 Después de Abrir el Túnel

1. **Verás la página de detalles del túnel**
2. **Busca una de estas pestañas/secciones:**
   - **"Public Hostnames"** ← Esta es la que necesitas
   - **"Routes"** ← Alternativa
   - **"Ingress"** ← Otra alternativa
   - **"Configure"** ← Botón para configurar

3. **Click en "Public Hostnames"** (o la pestaña equivalente)

4. **Verás una lista de hostnames configurados**

5. **Verifica si `nala-api.patasypelos.xyz` está en la lista:**
   - ✅ **Si está:** El problema puede ser otro (DNS, propagación, etc.)
   - ❌ **Si NO está:** Necesitas agregarlo (siguiente paso)

## ➕ Agregar Hostname (Si NO Está)

1. **Click en:** "+ Add a public hostname" o "Add route" o "Configure"

2. **Completa el formulario:**
   - **Subdomain:** `nala-api`
   - **Domain:** `patasypelos.xyz` (selecciona del dropdown)
   - **Service:** `http://127.0.0.1:3000`
   - **Path:** (dejar vacío)
   - **HTTP Host Header:** `nala-api.patasypelos.xyz` (opcional pero recomendado)

3. **Click en:** "Save hostname" o "Add route"

4. **Espera 1-2 minutos** para que se propague

5. **Prueba:** `https://nala-api.patasypelos.xyz`

## 🔍 Si No Encuentras "Zero Trust" o "Connectors"

1. **Ve a la página principal de Cloudflare:**
   - Click en el logo de Cloudflare (arriba a la izquierda)
   - O ve a: https://dash.cloudflare.com/

2. **En la página principal**, busca:
   - **"Zero Trust"** en el menú lateral
   - O busca **"Tunnels"** directamente

3. **Los Tunnels pueden estar en:**
   - Zero Trust → Networks → Connectors → Cloudflare Tunnels
   - O directamente en el menú como "Tunnels"

## 📝 Nota Importante

- **Los Tunnels NO están en la sección "Network"** del dominio
- **Los Tunnels están en Zero Trust** (es una sección separada)
- **Puede que necesites tener permisos de Zero Trust** para ver esta sección

## 🆘 Si No Puedes Encontrar Tunnels

1. **Verifica que tengas acceso a Zero Trust:**
   - Los Tunnels requieren acceso a Cloudflare Zero Trust
   - Puede que necesites permisos adicionales en tu cuenta

2. **Intenta buscar en el dashboard principal:**
   - Ve a: https://dash.cloudflare.com/
   - Busca "Tunnels" en la búsqueda rápida (Ctrl+K)

3. **URL directa alternativa:**
   ```
   https://one.dash.cloudflare.com/
   ```
   Luego busca "Tunnels" en el menú

---

**✅ Resumen: Ve a Zero Trust → Networks → Connectors → Cloudflare Tunnels → mundialpet-tunnel → Public Hostnames**
