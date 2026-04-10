# 🔧 Configurar Hostname en el Túnel de Cloudflare

## 📍 Ubicación Actual

Si estás en la página **"Network"** del dominio, necesitas navegar a otra sección.

## 🧭 Cómo Llegar a Tunnels

### Desde Network (Donde Estás Ahora)

1. **En el menú lateral izquierdo**, busca:
   - **"Zero Trust"** (puede estar más abajo)
   - O **"Connectors"** directamente

2. **Si ves "Zero Trust":**
   - Click en **"Zero Trust"**
   - Luego busca **"Networks"** o **"Connectors"** en el submenú
   - Click en **"Cloudflare Tunnels"** o **"Tunnels"**

3. **Alternativa rápida:** Presiona `Ctrl + K` y busca `tunnels` o `mundialpet-tunnel`

### Una Vez que Estés en Tunnels

Deberías ver: **Networks → Connectors → Cloudflare Tunnels**

Ves el túnel: **mundialpet-tunnel** (Status: HEALTHY)

## ⚠️ Problema Detectado

La columna **"Routes"** muestra **"--"**, lo que significa que **no hay hostnames públicos configurados** en el túnel.

## ✅ Solución: Configurar Hostname Público

### Paso 1: Abrir el Túnel

1. **Click en "mundialpet-tunnel"** (el nombre del túnel, es un link)

### Paso 2: Ir a Public Hostnames

1. En la página de detalles del túnel, busca la sección **"Public Hostnames"** o **"Ingress"**
2. O busca un botón/tab que diga **"Public Hostnames"** o **"Routes"**

### Paso 3: Agregar Hostname

1. Click en **"+ Add a public hostname"** o **"Configure"** o **"Add route"**

2. Configura:
   - **Subdomain:** `nala-api`
   - **Domain:** `patasypelos.xyz` (selecciona del dropdown)
   - **Service:** `http://127.0.0.1:3000`
   - **Path:** (dejar vacío)
   - **HTTP Host Header:** `nala-api.patasypelos.xyz` (opcional, pero recomendado)

3. Click en **"Save hostname"** o **"Add route"**

### Paso 4: Verificar

Después de agregar, deberías ver:
- `nala-api.patasypelos.xyz` en la lista de Public Hostnames
- La columna "Routes" debería mostrar el hostname

### Paso 5: Esperar y Probar

1. **Espera 1-2 minutos** para que se propague
2. **Prueba:** `https://nala-api.patasypelos.xyz`

## 🔍 Si No Encuentras "Public Hostnames"

Busca estas secciones alternativas:
- **"Routes"** tab
- **"Ingress"** section
- **"Configure"** button
- **"Edit"** button del túnel

## 📝 Nota Importante

- **El archivo `config.yml` local** solo configura el túnel localmente
- **Cloudflare Dashboard** es donde se registran los hostnames públicamente
- **Ambos deben estar configurados** para que funcione

---

**✅ Click en "mundialpet-tunnel" y busca la sección "Public Hostnames" o "Routes"**
